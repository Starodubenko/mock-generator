import { GetJobDraftsHandler } from './get-job-drafts.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type { JobRecord } from '@entities/job/job.types';

const job = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  jobId: 'job-drafts-1',
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

describe('GetJobDraftsHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new GetJobDraftsHandler(store);

  beforeEach(() => {
    inMemoryDatabase.jobs.clear();
    inMemoryDatabase.draftDocumentsByJob.clear();
  });

  it('should_return_empty_list_when_job_has_no_draft', async () => {
    await store.saveJob(job());
    expect(await handler.execute('job-drafts-1')).toEqual([]);
  });

  it('should_return_saved_drafts', async () => {
    await store.saveJob(job());
    await store.saveDraftDocuments('job-drafts-1', [
      { id: 'd1', body: { status: 'NEW' } },
    ]);
    expect(await handler.execute('job-drafts-1')).toEqual([
      { id: 'd1', body: { status: 'NEW' } },
    ]);
  });

  it('should_reject_missing_job', async () => {
    await expect(handler.execute('missing')).rejects.toThrow(
      DomainHttpException,
    );
  });
});
