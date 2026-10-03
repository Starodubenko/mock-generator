import { PrismaClient } from '@prisma/client';
import { postgresUrl, type IndexerConfig } from '../config';
import { PROCESS_STORE_OPS, type ProcessStoreOp } from './process-store.ops';

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const sqlText = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const sqlInt = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const parseJson = (value: string | null | undefined, fallback: unknown): unknown => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const asJsonArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const linksOf = (version: JsonRecord): JsonRecord => ({
  identifierPaths: asJsonArray(version.identifierPaths),
  dateShiftPaths: asJsonArray(version.dateShiftPaths),
  dateOrderInvariants: asJsonArray(version.dateOrderInvariants),
  parentChildInvariants: asJsonArray(version.parentChildInvariants),
  valueEqualities: asJsonArray(version.valueEqualities),
  crossTypeLinks: asJsonArray(version.crossTypeLinks),
});

const fingerprintsOf = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (value instanceof Set) {
    return [...value].filter((item): item is string => typeof item === 'string');
  }
  return [];
};

export const createProcessPrisma = (config: IndexerConfig): PrismaClient =>
  new PrismaClient({
    datasources: { db: { url: postgresUrl(config) } },
  });

export class PostgresProcessStore {
  constructor(
    readonly prisma: PrismaClient,
    private readonly config: IndexerConfig,
  ) {}

  async init(): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "array_paths" TEXT`,
    );
    await this.ensureDocumentTypesSeeded();
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async dispatch(op: string, args: JsonRecord): Promise<unknown> {
    if (!PROCESS_STORE_OPS.includes(op as ProcessStoreOp)) {
      throw new Error(`unknown_op:${op}`);
    }
    switch (op as ProcessStoreOp) {
      case 'getJob':
        return (await this.getJob(asString(args.jobId))) ?? null;
      case 'saveJob':
        return this.saveJob(asRecord(args.job));
      case 'listJobs':
        return this.listJobs(asRecord(args.filter));
      case 'hasTrainingInFlight':
        return this.hasTrainingInFlight(asString(args.key));
      case 'setTrainingInFlight':
        return this.setTrainingInFlight(asString(args.key), asString(args.jobId));
      case 'clearTrainingInFlight':
        return this.clearTrainingInFlight(asString(args.key));
      case 'getIdempotency':
        return (await this.getIdempotency(asString(args.key))) ?? null;
      case 'saveIdempotency':
        return this.saveIdempotency(asRecord(args.record));
      case 'getProfile':
        return (
          (await this.getProfile(
            asString(args.documentType),
            asString(args.contour),
            asString(args.versionId),
          )) ?? null
        );
      case 'saveProfile':
        return this.saveProfile(asRecord(args.version));
      case 'getEnumExtras':
        return this.getEnumExtras(
          asString(args.documentType),
          asString(args.contour),
          asString(args.versionId),
        );
      case 'addEnumExtra':
        return this.addEnumExtra(
          asString(args.documentType),
          asString(args.contour),
          asString(args.versionId),
          asString(args.path),
          asString(args.value),
        );
      case 'listProfiles':
        return this.listProfiles(asString(args.documentType), asString(args.contour));
      case 'deleteProfile':
        return this.deleteProfile(
          asString(args.documentType),
          asString(args.contour),
          asString(args.versionId),
        );
      case 'getVersionLabel':
        return (
          (await this.getVersionLabel(
            asString(args.documentType),
            asString(args.contour),
            asString(args.versionId),
          )) ?? null
        );
      case 'setVersionLabel':
        return this.setVersionLabel(
          asString(args.documentType),
          asString(args.contour),
          asString(args.versionId),
          asString(args.label),
        );
      case 'getActiveVersionId':
        return (
          (await this.getActiveVersionId(asString(args.documentType), asString(args.contour))) ?? null
        );
      case 'setActiveVersionId':
        return this.setActiveVersionId(
          asString(args.documentType),
          asString(args.contour),
          asString(args.versionId),
        );
      case 'appendActivation':
        return this.appendActivation(asRecord(args.record));
      case 'wasActivated':
        return this.wasActivated(
          asString(args.documentType),
          asString(args.contour),
          asString(args.versionId),
        );
      case 'getQuarantine':
        return this.getQuarantine(asString(args.jobId));
      case 'appendQuarantine':
        return this.appendQuarantine(
          asString(args.jobId),
          Array.isArray(args.items) ? args.items : [],
        );
      case 'markSyntheticIndex':
        return this.markSyntheticIndex(asString(args.index));
      case 'markSyntheticSource':
        return this.markSyntheticSource(asString(args.sourceIndex));
      case 'appendPublishedIds':
        return this.appendPublishedIds(
          asString(args.jobId),
          Array.isArray(args.ids) ? args.ids.filter((item): item is string => typeof item === 'string') : [],
        );
      case 'getPublishedIds':
        return this.getPublishedIds(asString(args.jobId));
      case 'saveDraftDocuments':
        return this.saveDraftDocuments(
          asString(args.jobId),
          Array.isArray(args.documents) ? args.documents : [],
        );
      case 'getDraftDocuments':
        return this.getDraftDocuments(asString(args.jobId));
      case 'listDocumentTypes':
        return this.listDocumentTypes();
      case 'hasDocumentType':
        return this.hasDocumentType(asString(args.documentType));
      case 'addDocumentType':
        return this.addDocumentType(asString(args.documentType));
      case 'deleteDocumentType':
        return this.deleteDocumentType(asString(args.documentType));
    }
  }

  async getJob(jobId: string): Promise<JsonRecord | undefined> {
    const job = await this.prisma.job.findUnique({ where: { jobId } });
    return job ? this.jobFromRecord(job) : undefined;
  }

  async saveJob(job: JsonRecord): Promise<void> {
    const data = {
      jobId: asString(job.jobId),
      kind: asString(job.kind),
      documentType: asString(job.documentType),
      contour: asString(job.contour),
      state: asString(job.state),
      profileVersionId: sqlText(job.profileVersionId),
      seed: sqlText(job.seed),
      requestedCount: sqlInt(job.requestedCount),
      publishedCount: asNumber(job.publishedCount),
      quarantineCount: asNumber(job.quarantineCount),
      reason: sqlText(job.reason),
      createdAt: asString(job.createdAt),
      finishedAt: sqlText(job.finishedAt),
      checkpointDocumentNumber: asNumber(job.checkpointDocumentNumber),
      targetIndex: sqlText(job.targetIndex),
      generatedAt: sqlText(job.generatedAt),
      fieldConstraints: job.fieldConstraints === undefined ? null : JSON.stringify(job.fieldConstraints),
      arrayPaths: job.arrayPaths === undefined ? null : JSON.stringify(job.arrayPaths),
    };
    await this.prisma.job.upsert({
      where: { jobId: data.jobId },
      create: data,
      update: data,
    });
  }

  async listJobs(filter: JsonRecord): Promise<JsonRecord[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        contour: typeof filter.contour === 'string' && filter.contour ? filter.contour : undefined,
        kind: typeof filter.kind === 'string' && filter.kind ? filter.kind : undefined,
        state: typeof filter.state === 'string' && filter.state ? filter.state : undefined,
        documentType:
          typeof filter.documentType === 'string' && filter.documentType ? filter.documentType : undefined,
      },
    });
    return jobs.map((job) => this.jobFromRecord(job));
  }

  async hasTrainingInFlight(key: string): Promise<boolean> {
    const row = await this.prisma.trainingInFlight.findUnique({ where: { key } });
    return Boolean(row);
  }

  async setTrainingInFlight(key: string, jobId: string): Promise<void> {
    await this.prisma.trainingInFlight.upsert({
      where: { key },
      create: { key, jobId },
      update: { jobId },
    });
  }

  async clearTrainingInFlight(key: string): Promise<void> {
    await this.prisma.trainingInFlight.deleteMany({ where: { key } });
  }

  async getIdempotency(key: string): Promise<JsonRecord | undefined> {
    const row = await this.prisma.idempotency.findUnique({ where: { key } });
    if (!row) {
      return undefined;
    }
    return { key: row.key, bodyHash: row.bodyHash, jobId: row.jobId };
  }

  async saveIdempotency(record: JsonRecord): Promise<void> {
    const data = {
      key: asString(record.key),
      bodyHash: asString(record.bodyHash),
      jobId: asString(record.jobId),
    };
    await this.prisma.idempotency.upsert({
      where: { key: data.key },
      create: data,
      update: data,
    });
  }

  async getProfile(documentType: string, contour: string, versionId: string): Promise<JsonRecord | undefined> {
    const row = await this.prisma.profileVersion.findUnique({
      where: { documentType_contour_versionId: { documentType, contour, versionId } },
    });
    return row ? this.profileFromRecord(row) : undefined;
  }

  async saveProfile(version: JsonRecord): Promise<void> {
    const data = {
      documentType: asString(version.documentType),
      contour: asString(version.contour),
      versionId: asString(version.versionId),
      snapshotId: asString(version.snapshotId),
      createdAt: asString(version.createdAt),
      mappingIndex: asString(version.mappingIndex),
      paths: JSON.stringify(version.paths ?? []),
      aliases: JSON.stringify(version.aliases ?? []),
      corpusValueFingerprints: JSON.stringify(fingerprintsOf(version.corpusValueFingerprints)),
      sampleDocumentCount: asNumber(version.sampleDocumentCount),
      activatable: Boolean(version.activatable),
      links: JSON.stringify(linksOf(version)),
    };
    await this.prisma.profileVersion.upsert({
      where: {
        documentType_contour_versionId: {
          documentType: data.documentType,
          contour: data.contour,
          versionId: data.versionId,
        },
      },
      create: data,
      update: data,
    });
  }

  async getEnumExtras(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<Record<string, string[]>> {
    const rows = await this.prisma.enumExtra.findMany({ where: { documentType, contour, versionId } });
    const extras: Record<string, string[]> = {};
    for (const row of rows) {
      extras[row.path] = extras[row.path] ? [...extras[row.path], row.value] : [row.value];
    }
    return extras;
  }

  async addEnumExtra(
    documentType: string,
    contour: string,
    versionId: string,
    path: string,
    value: string,
  ): Promise<void> {
    await this.prisma.enumExtra.createMany({
      data: [{ documentType, contour, versionId, path, value }],
      skipDuplicates: true,
    });
  }

  async listProfiles(documentType: string, contour: string): Promise<JsonRecord[]> {
    const rows = await this.prisma.profileVersion.findMany({ where: { documentType, contour } });
    return rows.map((row) => this.profileFromRecord(row));
  }

  async deleteProfile(documentType: string, contour: string, versionId: string): Promise<void> {
    const where = { documentType, contour, versionId };
    await this.prisma.$transaction([
      this.prisma.profileVersion.deleteMany({ where }),
      this.prisma.enumExtra.deleteMany({ where }),
      this.prisma.versionLabel.deleteMany({ where }),
    ]);
  }

  async getVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<string | undefined> {
    const row = await this.prisma.versionLabel.findUnique({
      where: { documentType_contour_versionId: { documentType, contour, versionId } },
    });
    return row?.label;
  }

  async setVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
    label: string,
  ): Promise<void> {
    await this.prisma.versionLabel.upsert({
      where: { documentType_contour_versionId: { documentType, contour, versionId } },
      create: { documentType, contour, versionId, label },
      update: { label },
    });
  }

  async getActiveVersionId(documentType: string, contour: string): Promise<string | undefined> {
    const row = await this.prisma.activeVersion.findUnique({
      where: { documentType_contour: { documentType, contour } },
    });
    return row?.versionId;
  }

  async setActiveVersionId(documentType: string, contour: string, versionId: string): Promise<void> {
    await this.prisma.activeVersion.upsert({
      where: { documentType_contour: { documentType, contour } },
      create: { documentType, contour, versionId },
      update: { versionId },
    });
  }

  async appendActivation(record: JsonRecord): Promise<void> {
    await this.prisma.activationJournal.create({
      data: {
        documentType: asString(record.documentType),
        contour: asString(record.contour),
        versionId: asString(record.versionId),
        previousVersionId: sqlText(record.previousVersionId),
        activatedAt: asString(record.activatedAt),
      },
    });
  }

  async wasActivated(documentType: string, contour: string, versionId: string): Promise<boolean> {
    const row = await this.prisma.activationJournal.findFirst({
      where: { documentType, contour, versionId },
    });
    return Boolean(row);
  }

  async getQuarantine(jobId: string): Promise<Array<{ documentId: string; reason: string }>> {
    const rows = await this.prisma.quarantine.findMany({ where: { jobId }, orderBy: { id: 'asc' } });
    return rows.map((row) => ({ documentId: row.documentId, reason: row.reason }));
  }

  async appendQuarantine(jobId: string, items: unknown[]): Promise<void> {
    if (items.length === 0) {
      return;
    }
    await this.prisma.quarantine.createMany({
      data: items.map((item) => {
        const row = asRecord(item);
        return { jobId, documentId: asString(row.documentId), reason: asString(row.reason) };
      }),
    });
  }

  async markSyntheticIndex(index: string): Promise<void> {
    await this.prisma.syntheticIndex.createMany({ data: [{ name: index }], skipDuplicates: true });
    await this.prisma.syntheticSource.createMany({ data: [{ name: index }], skipDuplicates: true });
  }

  async markSyntheticSource(sourceIndex: string): Promise<void> {
    await this.prisma.syntheticSource.createMany({ data: [{ name: sourceIndex }], skipDuplicates: true });
  }

  async appendPublishedIds(jobId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.prisma.publishedId.createMany({
      data: ids.map((documentId) => ({ jobId, documentId })),
    });
  }

  async getPublishedIds(jobId: string): Promise<string[]> {
    const rows = await this.prisma.publishedId.findMany({ where: { jobId }, orderBy: { id: 'asc' } });
    return rows.map((row) => row.documentId);
  }

  async saveDraftDocuments(jobId: string, documents: unknown[]): Promise<void> {
    const documentsJson = JSON.stringify(documents);
    await this.prisma.draftDocument.upsert({
      where: { jobId },
      create: { jobId, documents: documentsJson },
      update: { documents: documentsJson },
    });
  }

  async getDraftDocuments(jobId: string): Promise<unknown[]> {
    const row = await this.prisma.draftDocument.findUnique({ where: { jobId } });
    const parsed = parseJson(row?.documents, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  async listDocumentTypes(): Promise<Array<{ documentType: string }>> {
    await this.ensureDocumentTypesSeeded();
    const rows = await this.prisma.documentType.findMany({ orderBy: { documentType: 'asc' } });
    return rows.map((row) => ({ documentType: row.documentType }));
  }

  async hasDocumentType(documentType: string): Promise<boolean> {
    await this.ensureDocumentTypesSeeded();
    const row = await this.prisma.documentType.findUnique({ where: { documentType } });
    return Boolean(row);
  }

  async addDocumentType(documentType: string): Promise<void> {
    await this.ensureDocumentTypesSeeded();
    await this.prisma.documentType.createMany({ data: [{ documentType }], skipDuplicates: true });
  }

  async deleteDocumentType(documentType: string): Promise<void> {
    await this.ensureDocumentTypesSeeded();
    await this.prisma.$transaction([
      this.prisma.profileVersion.deleteMany({ where: { documentType } }),
      this.prisma.enumExtra.deleteMany({ where: { documentType } }),
      this.prisma.versionLabel.deleteMany({ where: { documentType } }),
      this.prisma.activeVersion.deleteMany({ where: { documentType } }),
      this.prisma.activationJournal.deleteMany({ where: { documentType } }),
      this.prisma.documentType.deleteMany({ where: { documentType } }),
    ]);
  }

  private jobFromRecord(job: {
    jobId: string;
    kind: string;
    documentType: string;
    contour: string;
    state: string;
    profileVersionId: string | null;
    seed: string | null;
    requestedCount: number | null;
    publishedCount: number;
    quarantineCount: number;
    reason: string | null;
    createdAt: string;
    finishedAt: string | null;
    checkpointDocumentNumber: number;
    targetIndex: string | null;
    generatedAt: string | null;
    fieldConstraints: string | null;
    arrayPaths: string | null;
  }): JsonRecord {
    return {
      jobId: job.jobId,
      kind: job.kind,
      documentType: job.documentType,
      contour: job.contour,
      state: job.state,
      profileVersionId: job.profileVersionId,
      seed: job.seed,
      requestedCount: job.requestedCount,
      publishedCount: job.publishedCount,
      quarantineCount: job.quarantineCount,
      reason: job.reason,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
      checkpointDocumentNumber: job.checkpointDocumentNumber,
      targetIndex: job.targetIndex,
      generatedAt: job.generatedAt,
      fieldConstraints: parseJson(job.fieldConstraints, undefined),
      arrayPaths: parseJson(job.arrayPaths, undefined),
    };
  }

  private profileFromRecord(row: {
    versionId: string;
    documentType: string;
    contour: string;
    snapshotId: string;
    createdAt: string;
    mappingIndex: string;
    paths: string;
    aliases: string;
    corpusValueFingerprints: string;
    sampleDocumentCount: number;
    activatable: boolean;
    links: string;
  }): JsonRecord {
    const links = asRecord(parseJson(row.links, {}));
    return {
      versionId: row.versionId,
      documentType: row.documentType,
      contour: row.contour,
      snapshotId: row.snapshotId,
      createdAt: row.createdAt,
      mappingIndex: row.mappingIndex,
      paths: parseJson(row.paths, []),
      aliases: parseJson(row.aliases, []),
      corpusValueFingerprints: parseJson(row.corpusValueFingerprints, []),
      sampleDocumentCount: row.sampleDocumentCount,
      activatable: row.activatable,
      ...linksOf(links),
    };
  }

  private async ensureDocumentTypesSeeded(): Promise<void> {
    const seeded = await this.prisma.meta.findUnique({ where: { key: 'document_types_seeded' } });
    if (seeded?.value === '1') {
      return;
    }
    if (this.config.seedDocumentTypes.length > 0) {
      await this.prisma.documentType.createMany({
        data: this.config.seedDocumentTypes.map((documentType) => ({ documentType })),
        skipDuplicates: true,
      });
    }
    await this.prisma.meta.upsert({
      where: { key: 'document_types_seeded' },
      create: { key: 'document_types_seeded', value: '1' },
      update: { value: '1' },
    });
  }
}
