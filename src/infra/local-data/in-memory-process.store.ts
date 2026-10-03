import { Inject, Injectable, Optional } from '@nestjs/common';
import { loadServiceConfig } from '@entities/config/service-config';
import type { JobRecord } from '@entities/job/job.types';
import type { ProfileVersion } from '@entities/profile/profile.types';
import { CONSOLE_LIVE, ConsoleLivePort } from '@repositories/console-live.port';
import {
  ActivationRecord,
  DocumentTypeRecord,
  IdempotencyRecord,
  JobListFilter,
  ProcessStore,
  DraftDocument,
  QuarantineItem,
} from '@repositories/process-store.port';
import { emitJobChanged } from '../console-live/emit-job-changed';
import { inMemoryDatabase } from './in-memory-database';

@Injectable()
export class InMemoryProcessStore extends ProcessStore {
  constructor(
    @Optional()
    @Inject(CONSOLE_LIVE)
    private readonly live?: ConsoleLivePort,
  ) {
    super();
  }
  async getJob(jobId: string): Promise<JobRecord | undefined> {
    return inMemoryDatabase.jobs.get(jobId);
  }

  async saveJob(job: JobRecord): Promise<void> {
    inMemoryDatabase.jobs.set(job.jobId, job);
    await emitJobChanged(this.live, this, job);
  }

  async listJobs(filter: JobListFilter): Promise<JobRecord[]> {
    return [...inMemoryDatabase.jobs.values()].filter((job) => {
      if (filter.contour && job.contour !== filter.contour) {
        return false;
      }
      if (filter.kind && job.kind !== filter.kind) {
        return false;
      }
      if (filter.state && job.state !== filter.state) {
        return false;
      }
      if (filter.documentType && job.documentType !== filter.documentType) {
        return false;
      }
      return true;
    });
  }

  async hasTrainingInFlight(key: string): Promise<boolean> {
    return inMemoryDatabase.trainingInFlight.has(key);
  }

  async setTrainingInFlight(key: string, jobId: string): Promise<void> {
    inMemoryDatabase.trainingInFlight.set(key, jobId);
  }

  async clearTrainingInFlight(key: string): Promise<void> {
    inMemoryDatabase.trainingInFlight.delete(key);
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | undefined> {
    return inMemoryDatabase.idempotency.get(key);
  }

  async saveIdempotency(record: IdempotencyRecord): Promise<void> {
    inMemoryDatabase.idempotency.set(record.key, record);
  }

  async getProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<ProfileVersion | undefined> {
    return inMemoryDatabase.profileVersions.get(
      `${documentType}:${contour}:${versionId}`,
    );
  }

  async saveProfile(version: ProfileVersion): Promise<void> {
    inMemoryDatabase.profileVersions.set(
      `${version.documentType}:${version.contour}:${version.versionId}`,
      version,
    );
  }

  async getEnumExtras(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<Record<string, string[]>> {
    const extras = inMemoryDatabase.enumExtrasByVersion.get(
      `${documentType}:${contour}:${versionId}`,
    );
    if (!extras) {
      return {};
    }
    return Object.fromEntries(extras);
  }

  async addEnumExtra(
    documentType: string,
    contour: string,
    versionId: string,
    path: string,
    value: string,
  ): Promise<void> {
    const key = `${documentType}:${contour}:${versionId}`;
    const extras =
      inMemoryDatabase.enumExtrasByVersion.get(key) ??
      new Map<string, string[]>();
    const current = extras.get(path) ?? [];
    if (!current.includes(value)) {
      extras.set(path, [...current, value]);
    }
    inMemoryDatabase.enumExtrasByVersion.set(key, extras);
  }

  async listProfiles(
    documentType: string,
    contour: string,
  ): Promise<ProfileVersion[]> {
    const prefix = `${documentType}:${contour}:`;
    return [...inMemoryDatabase.profileVersions.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, version]) => version);
  }

  async deleteProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void> {
    const key = `${documentType}:${contour}:${versionId}`;
    inMemoryDatabase.profileVersions.delete(key);
    inMemoryDatabase.enumExtrasByVersion.delete(key);
    inMemoryDatabase.versionLabels.delete(key);
  }

  async getVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<string | undefined> {
    return inMemoryDatabase.versionLabels.get(
      `${documentType}:${contour}:${versionId}`,
    );
  }

  async setVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
    label: string,
  ): Promise<void> {
    inMemoryDatabase.versionLabels.set(
      `${documentType}:${contour}:${versionId}`,
      label,
    );
  }

  async getActiveVersionId(
    documentType: string,
    contour: string,
  ): Promise<string | undefined> {
    return inMemoryDatabase.activeVersionByContour.get(
      `${documentType}:${contour}`,
    );
  }

  async setActiveVersionId(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void> {
    inMemoryDatabase.activeVersionByContour.set(
      `${documentType}:${contour}`,
      versionId,
    );
  }

  async appendActivation(record: ActivationRecord): Promise<void> {
    inMemoryDatabase.activationJournal.push(record);
  }

  async wasActivated(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<boolean> {
    return inMemoryDatabase.activationJournal.some(
      (item) =>
        item.documentType === documentType &&
        item.contour === contour &&
        item.versionId === versionId,
    );
  }

  async getQuarantine(jobId: string): Promise<QuarantineItem[]> {
    return inMemoryDatabase.quarantineByJob.get(jobId) ?? [];
  }

  async appendQuarantine(
    jobId: string,
    items: QuarantineItem[],
  ): Promise<void> {
    const current = inMemoryDatabase.quarantineByJob.get(jobId) ?? [];
    inMemoryDatabase.quarantineByJob.set(jobId, [...current, ...items]);
  }

  async markSyntheticIndex(index: string): Promise<void> {
    inMemoryDatabase.syntheticIndices.add(index);
    inMemoryDatabase.syntheticSources.add(index);
  }

  async markSyntheticSource(sourceIndex: string): Promise<void> {
    inMemoryDatabase.syntheticSources.add(sourceIndex);
  }

  async appendPublishedIds(jobId: string, ids: string[]): Promise<void> {
    const current = inMemoryDatabase.publishedIdsByJob.get(jobId) ?? [];
    inMemoryDatabase.publishedIdsByJob.set(jobId, [...current, ...ids]);
  }

  async getPublishedIds(jobId: string): Promise<string[]> {
    return inMemoryDatabase.publishedIdsByJob.get(jobId) ?? [];
  }

  async saveDraftDocuments(
    jobId: string,
    documents: DraftDocument[],
  ): Promise<void> {
    inMemoryDatabase.draftDocumentsByJob.set(jobId, documents);
  }

  async getDraftDocuments(jobId: string): Promise<DraftDocument[]> {
    return inMemoryDatabase.draftDocumentsByJob.get(jobId) ?? [];
  }

  async listDocumentTypes(): Promise<DocumentTypeRecord[]> {
    this.ensureDocumentTypesSeeded();
    return [...inMemoryDatabase.documentTypes.keys()].map((documentType) => ({
      documentType,
    }));
  }

  async hasDocumentType(documentType: string): Promise<boolean> {
    this.ensureDocumentTypesSeeded();
    return inMemoryDatabase.documentTypes.has(documentType);
  }

  async addDocumentType(documentType: string): Promise<void> {
    this.ensureDocumentTypesSeeded();
    inMemoryDatabase.documentTypes.set(documentType, documentType);
  }

  async deleteDocumentType(documentType: string): Promise<void> {
    this.ensureDocumentTypesSeeded();
    const prefix = `${documentType}:`;
    for (const key of [...inMemoryDatabase.profileVersions.keys()]) {
      if (key.startsWith(prefix)) {
        inMemoryDatabase.profileVersions.delete(key);
        inMemoryDatabase.enumExtrasByVersion.delete(key);
        inMemoryDatabase.versionLabels.delete(key);
      }
    }
    for (const key of [...inMemoryDatabase.activeVersionByContour.keys()]) {
      if (key.startsWith(prefix)) {
        inMemoryDatabase.activeVersionByContour.delete(key);
      }
    }
    inMemoryDatabase.activationJournal =
      inMemoryDatabase.activationJournal.filter(
        (item) => item.documentType !== documentType,
      );
    inMemoryDatabase.documentTypes.delete(documentType);
  }

  private ensureDocumentTypesSeeded(): void {
    if (inMemoryDatabase.documentTypesSeeded) {
      return;
    }
    inMemoryDatabase.documentTypesSeeded = true;
    loadServiceConfig()
      .enabledDocumentTypes.filter((item) => item.enabled)
      .forEach((item) => {
        inMemoryDatabase.documentTypes.set(
          item.documentType,
          item.documentType,
        );
      });
  }
}
