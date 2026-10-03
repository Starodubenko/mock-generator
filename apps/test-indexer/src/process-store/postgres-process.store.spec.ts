import { loadIndexerConfig } from '../config';
import { createProcessPrisma, PostgresProcessStore } from './postgres-process.store';

const testConfig = () => ({
  ...loadIndexerConfig(),
  seedDocumentTypes: ['document'],
  postgres: {
    host: '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT ?? 5434),
    user: process.env.POSTGRES_USER ?? 'indexer',
    password: process.env.POSTGRES_PASSWORD ?? 'indexer',
    database: 'indexer_test',
  },
});

const storeOf = async (): Promise<PostgresProcessStore> => {
  const config = testConfig();
  const prisma = createProcessPrisma(config);
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE
      jobs, profile_versions, active_versions, idempotency, training_in_flight,
      enum_extras, version_labels, activation_journal, quarantine, synthetic_indices,
      synthetic_sources, published_ids, draft_documents, document_types, meta
     RESTART IDENTITY CASCADE`,
  );
  const store = new PostgresProcessStore(prisma, config);
  await store.init();
  return store;
};

describe('PostgresProcessStore', () => {
  it('should_seed_document_types_and_roundtrip_job_profile_activation', async () => {
    const store = await storeOf();
    expect(await store.hasDocumentType('document')).toBe(true);
    expect(await store.listDocumentTypes()).toEqual([{ documentType: 'document' }]);

    await store.saveJob({
      jobId: 'job-1',
      kind: 'train',
      documentType: 'document',
      contour: 'test-stand',
      state: 'succeeded',
      profileVersionId: 'v1',
      seed: null,
      requestedCount: 10,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: '2026-01-01T00:00:00Z',
      finishedAt: '2026-01-01T00:01:00Z',
      checkpointDocumentNumber: 0,
      targetIndex: null,
      generatedAt: null,
      fieldConstraints: [{ path: 'status', kind: 'category', values: ['NEW'] }],
    });
    const job = await store.getJob('job-1');
    expect(job?.jobId).toBe('job-1');
    expect(job?.fieldConstraints).toEqual([{ path: 'status', kind: 'category', values: ['NEW'] }]);

    await store.saveProfile({
      versionId: 'v1',
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit',
      createdAt: '2026-01-01T00:00:00Z',
      mappingIndex: 'documents-synthetic',
      paths: [{ path: 'status', pathClass: 'category' }],
      aliases: [],
      corpusValueFingerprints: ['aa', 'bb'],
      sampleDocumentCount: 10,
      activatable: true,
      identifierPaths: ['id', 'entityId'],
      dateShiftPaths: ['creationDateTime'],
      dateOrderInvariants: [{ earlierPath: 'docDate', laterPath: 'creationDateTime' }],
      parentChildInvariants: [
        { parentPath: 'id', childPath: 'entityId', arrayPath: 'childItems' },
      ],
      valueEqualities: [{ scope: 'document', paths: ['id', 'entityId'] }],
      crossTypeLinks: [],
    });
    const profile = await store.getProfile('document', 'test-stand', 'v1');
    expect(profile?.corpusValueFingerprints).toEqual(['aa', 'bb']);
    expect(profile?.activatable).toBe(true);
    expect(profile?.identifierPaths).toEqual(['id', 'entityId']);
    expect(profile?.parentChildInvariants).toEqual([
      { parentPath: 'id', childPath: 'entityId', arrayPath: 'childItems' },
    ]);

    await store.setActiveVersionId('document', 'test-stand', 'v1');
    await store.appendActivation({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      previousVersionId: null,
      activatedAt: '2026-01-01T00:00:00Z',
    });
    expect(await store.getActiveVersionId('document', 'test-stand')).toBe('v1');
    expect(await store.wasActivated('document', 'test-stand', 'v1')).toBe(true);

    await store.saveIdempotency({ key: 'k1', bodyHash: 'h1', jobId: 'job-1' });
    expect(await store.getIdempotency('k1')).toEqual({ key: 'k1', bodyHash: 'h1', jobId: 'job-1' });
    expect(await store.dispatch('getJob', { jobId: 'missing' })).toBeNull();
    await store.close();
  });

  it('should_cascade_delete_document_type', async () => {
    const store = await storeOf();
    await store.addDocumentType('related');
    await store.saveProfile({
      versionId: 'v1',
      documentType: 'related',
      contour: 'test-stand',
      snapshotId: 'pit',
      createdAt: '2026-01-01T00:00:00Z',
      mappingIndex: 'related-synthetic',
      paths: [],
      aliases: [],
      corpusValueFingerprints: [],
      sampleDocumentCount: 1,
      activatable: true,
    });
    await store.setVersionLabel('related', 'test-stand', 'v1', 'стенд');
    await store.setActiveVersionId('related', 'test-stand', 'v1');
    await store.deleteDocumentType('related');
    expect(await store.hasDocumentType('related')).toBe(false);
    expect(await store.listProfiles('related', 'test-stand')).toEqual([]);
    expect(await store.getActiveVersionId('related', 'test-stand')).toBeUndefined();
    expect(await store.getVersionLabel('related', 'test-stand', 'v1')).toBeUndefined();
    await store.close();
  });
});
