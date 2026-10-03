import { PublishJobHandler } from './publish-job.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { LocalOpenSearchIndexAdapter } from '@infra/local-data/local-opensearch-index.adapter';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type { JobRecord } from '@entities/job/job.types';
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
  ],
};

const generateJob = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  jobId: 'job-publish-1',
  kind: 'generate',
  documentType: 'document',
  contour: 'test-stand',
  state: 'preview',
  profileVersionId: 'v1',
  seed: 'seed',
  requestedCount: 1,
  publishedCount: 0,
  quarantineCount: 0,
  reason: null,
  createdAt: '2026-09-24T21:00:00+03:00',
  finishedAt: null,
  checkpointDocumentNumber: 0,
  targetIndex: 'documents-synthetic',
  generatedAt: '2026-09-24T21:00:00+03:00',
  ...overrides,
});

describe('PublishJobHandler', () => {
  const adapter = new LocalOpenSearchIndexAdapter();
  const store = new InMemoryProcessStore();
  let handler: PublishJobHandler;

  beforeEach(async () => {
    inMemoryDatabase.jobs.clear();
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.enumExtrasByVersion.clear();
    inMemoryDatabase.draftDocumentsByJob.clear();
    inMemoryDatabase.documentsByIndex.clear();
    inMemoryDatabase.quarantineByJob.clear();
    inMemoryDatabase.publishedIdsByJob.clear();
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
    await store.saveProfile(version);
    handler = new PublishJobHandler(adapter, store);
  });

  it('should_move_preview_to_canary_when_drafts_exist', async () => {
    await store.saveJob(generateJob());
    await store.saveDraftDocuments('job-publish-1', [
      { id: 'd1', body: { id: 'd1', status: 'NEW' } },
    ]);
    const result = await handler.execute('job-publish-1');
    expect(result.state).toBe('canary');
    expect((await store.getJob('job-publish-1'))?.state).toBe('canary');
    expect(
      inMemoryDatabase.documentsByIndex.get('documents-synthetic')?.size ??
        0,
    ).toBe(0);
  });

  it('should_replay_canary_without_changing_state', async () => {
    await store.saveJob(generateJob({ state: 'canary' }));
    await store.saveDraftDocuments('job-publish-1', [
      { id: 'd1', body: { id: 'd1' } },
    ]);
    expect((await handler.execute('job-publish-1')).state).toBe('canary');
  });

  it('should_reject_missing_job', async () => {
    await expect(handler.execute('missing')).rejects.toThrow(
      DomainHttpException,
    );
  });

  it('should_reject_train_job', async () => {
    await store.saveJob(generateJob({ kind: 'train', state: 'succeeded' }));
    await expect(handler.execute('job-publish-1')).rejects.toThrow(
      DomainHttpException,
    );
  });

  it('should_reject_empty_draft', async () => {
    await store.saveJob(generateJob());
    await expect(handler.execute('job-publish-1')).rejects.toThrow(
      DomainHttpException,
    );
  });

  it('should_reject_accepted_before_preview', async () => {
    await store.saveJob(generateJob({ state: 'accepted' }));
    await store.saveDraftDocuments('job-publish-1', [
      { id: 'd1', body: { id: 'd1' } },
    ]);
    await expect(handler.execute('job-publish-1')).rejects.toThrow(
      DomainHttpException,
    );
  });

  it('should_set_target_index_from_publish_input', async () => {
    await store.saveJob(generateJob({ targetIndex: 'old-synthetic' }));
    await store.saveDraftDocuments('job-publish-1', [
      { id: 'd1', body: { id: 'd1', status: 'NEW' } },
    ]);
    await handler.execute('job-publish-1', {
      targetIndex: 'documents-synthetic',
    });
    expect((await store.getJob('job-publish-1'))?.targetIndex).toBe(
      'documents-synthetic',
    );
  });

  it('should_reject_blank_target_index', async () => {
    await store.saveJob(generateJob({ targetIndex: null }));
    await store.saveDraftDocuments('job-publish-1', [
      { id: 'd1', body: { id: 'd1' } },
    ]);
    await expect(
      handler.execute('job-publish-1', { targetIndex: '   ' }),
    ).rejects.toThrow(DomainHttpException);
  });

  it('should_reject_succeeded_job', async () => {
    await store.saveJob(generateJob({ state: 'succeeded' }));
    await expect(handler.execute('job-publish-1')).rejects.toThrow(
      DomainHttpException,
    );
  });
});
