import {
  prepareGenerateDraft,
  runGeneratePublisher,
} from './generate-publisher';
import { LocalOpenSearchIndexAdapter } from '@infra/local-data/local-opensearch-index.adapter';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import { loadServiceConfig } from '@entities/config/service-config';
import type { ProfileVersion } from '@entities/profile/profile.types';

const version: ProfileVersion = {
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths: [
    {
      path: 'status',
      pathClass: 'category',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 2,
      missingKeyRate: 0,
      categoryValues: ['NEW', 'ERROR'],
    },
    {
      path: 'creationDateTime',
      pathClass: 'datetime',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
      datetimeFormat: 'date-time',
    },
    {
      path: 'messageType',
      pathClass: 'category',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 4,
      missingKeyRate: 0,
      categoryValues: ['type-a', 'type-b', 'type-c', 'type-d'],
    },
  ],
};

describe('runGeneratePublisher', () => {
  const adapter = new LocalOpenSearchIndexAdapter();
  const store = new InMemoryProcessStore();

  beforeEach(() => {
    inMemoryDatabase.jobs.clear();
    inMemoryDatabase.documentsByIndex.clear();
    inMemoryDatabase.refreshedIndices.clear();
    inMemoryDatabase.batchResults.clear();
    inMemoryDatabase.quarantineByJob.clear();
    inMemoryDatabase.publishedIdsByJob.clear();
    inMemoryDatabase.draftDocumentsByJob.clear();
    inMemoryDatabase.syntheticIndices.add('documents-synthetic');
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
  });

  it('should_finish_generate_job_with_checkpoint', async () => {
    const jobId = 'job-publisher-1';
    await store.saveJob({
      jobId,
      kind: 'generate',
      documentType: 'document',
      contour: 'test-stand',
      state: 'canary',
      profileVersionId: 'v1',
      seed: 'seed',
      requestedCount: 5,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
    });
    await runGeneratePublisher({
      jobId,
      command: {
        documentType: 'document',
        contour: 'test-stand',
        seed: 'seed',
        count: 5,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
      },
      version,
      config: loadServiceConfig(),
      indexPort: adapter,
      store,
      batchSize: 2,
    });
    const job = await store.getJob(jobId);
    expect(job?.state).toBe('succeeded');
    expect(job?.publishedCount).toBe(5);
    expect(job?.checkpointDocumentNumber).toBe(5);
  });

  it('should_keep_draft_off_the_stand_until_publish', async () => {
    const jobId = 'job-publisher-draft';
    await store.saveJob({
      jobId,
      kind: 'generate',
      documentType: 'document',
      contour: 'test-stand',
      state: 'accepted',
      profileVersionId: 'v1',
      seed: 'seed',
      requestedCount: 5,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
    });
    const input = {
      jobId,
      command: {
        documentType: 'document',
        contour: 'test-stand',
        seed: 'seed',
        count: 5,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
      },
      version,
      config: loadServiceConfig(),
      indexPort: adapter,
      store,
      batchSize: 2,
    };
    await prepareGenerateDraft(input);
    expect(await store.getDraftDocuments(jobId)).toHaveLength(5);
    expect((await store.getJob(jobId))?.state).toBe('preview');
    expect(
      inMemoryDatabase.documentsByIndex.get('documents-synthetic')?.size ??
        0,
    ).toBe(0);
    await store.saveJob({ ...(await store.getJob(jobId))!, state: 'canary' });
    await runGeneratePublisher(input);
    expect((await store.getJob(jobId))?.state).toBe('succeeded');
    expect((await store.getJob(jobId))?.publishedCount).toBe(5);
  });

  it('should_pass_canary_when_status_allow_list_is_only_NEW', async () => {
    const jobId = 'job-publisher-allowlist';
    await store.saveJob({
      jobId,
      kind: 'generate',
      documentType: 'document',
      contour: 'test-stand',
      state: 'canary',
      profileVersionId: 'v1',
      seed: 'seed',
      requestedCount: 3,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
      fieldConstraints: [{ path: 'status', kind: 'category', values: ['NEW'] }],
    });
    await runGeneratePublisher({
      jobId,
      command: {
        documentType: 'document',
        contour: 'test-stand',
        seed: 'seed',
        count: 3,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
        fieldConstraints: [
          { path: 'status', kind: 'category', values: ['NEW'] },
        ],
      },
      version,
      config: loadServiceConfig(),
      indexPort: adapter,
      store,
      batchSize: 2,
    });
    const job = await store.getJob(jobId);
    expect(job?.state).toBe('succeeded');
    const docs = [
      ...(inMemoryDatabase.documentsByIndex
        .get('documents-synthetic')
        ?.values() ?? []),
    ];
    expect(docs.every((item) => item.body.status === 'NEW')).toBe(true);
  });

  it('should_not_add_status_when_training_profile_has_no_status_path', async () => {
    const parentVersion: ProfileVersion = {
      ...version,
      versionId: 'v-parent',
      paths: [
        {
          path: 'createdAt',
          pathClass: 'datetime',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
          datetimeFormat: 'date-time',
        },
      ],
    };
    const jobId = 'job-publisher-parent-shape';
    await store.saveJob({
      jobId,
      kind: 'generate',
      documentType: 'document',
      contour: 'test-stand',
      state: 'accepted',
      profileVersionId: 'v-parent',
      seed: 'seed',
      requestedCount: 1,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
    });
    await prepareGenerateDraft({
      jobId,
      command: {
        documentType: 'document',
        contour: 'test-stand',
        seed: 'seed',
        count: 1,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
      },
      version: parentVersion,
      config: loadServiceConfig(),
      indexPort: adapter,
      store,
      batchSize: 2,
    });
    const [draft] = await store.getDraftDocuments(jobId);
    expect(draft?.body.status).toBeUndefined();
    expect(draft?.body.messageType).toBeUndefined();
    expect(draft?.body.creationDateTime).toBeUndefined();
  });

  it('should_publish_source_documents_from_search_export_draft', async () => {
    const jobId = 'job-publisher-export';
    await store.saveJob({
      jobId,
      kind: 'generate',
      documentType: 'document',
      contour: 'test-stand',
      state: 'canary',
      profileVersionId: 'v1',
      seed: 'seed',
      requestedCount: 1,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
    });
    await store.saveDraftDocuments(jobId, [
      {
        id: 'export-1',
        body: {
          took: 14,
          timed_out: false,
          hits: {
            hits: [
              {
                _id: 'parent-a',
                _source: {
                  id: 'parent-a',
                  status: 'NEW',
                  messageType: 'type-a',
                  creationDateTime: '2026-09-24T21:00:00+03:00',
                },
              },
            ],
          },
        },
      },
    ]);
    await runGeneratePublisher({
      jobId,
      command: {
        documentType: 'document',
        contour: 'test-stand',
        seed: 'seed',
        count: 1,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
      },
      version,
      config: loadServiceConfig(),
      indexPort: adapter,
      store,
      batchSize: 2,
    });
    expect((await store.getJob(jobId))?.state).toBe('succeeded');
    const published = [
      ...(inMemoryDatabase.documentsByIndex
        .get('documents-synthetic')
        ?.values() ?? []),
    ];
    expect(published).toHaveLength(1);
    expect(published[0]?.id).toBe('parent-a');
    expect(published[0]?.body).toEqual({
      id: 'parent-a',
      status: 'NEW',
      messageType: 'type-a',
      creationDateTime: '2026-09-24T21:00:00+03:00',
    });
    expect(published[0]?.body.took).toBeUndefined();
  });

  it('should_store_one_envelope_when_array_paths_set', async () => {
    const jobId = 'job-envelope';
    const envelopeVersion: ProfileVersion = {
      ...version,
      paths: [
        ...version.paths,
        {
          path: 'hits',
          pathClass: 'nested',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'hits.hits',
          pathClass: 'array',
          itemPathClass: 'nested',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'hits.hits._id',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 3,
          missingKeyRate: 0,
        },
      ],
    };
    await store.saveJob({
      jobId,
      kind: 'generate',
      documentType: 'document',
      contour: 'test-stand',
      state: 'accepted',
      profileVersionId: 'v1',
      seed: 'seed',
      requestedCount: 3,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
      arrayPaths: ['hits.hits'],
    });
    await prepareGenerateDraft({
      jobId,
      command: {
        documentType: 'document',
        contour: 'test-stand',
        seed: 'seed',
        count: 3,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
        arrayPaths: ['hits.hits'],
      },
      version: envelopeVersion,
      config: loadServiceConfig(),
      indexPort: adapter,
      store,
      batchSize: 2,
    });
    const drafts = await store.getDraftDocuments(jobId);
    expect(drafts).toHaveLength(1);
    const hits = (drafts[0]?.body.hits as { hits: unknown[] }).hits;
    expect(hits).toHaveLength(3);
  });
});
