import type { JobRecord } from '@entities/job/job.types';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import { ListJobsHandler } from './list-jobs.handler';

const job = (overrides: Partial<JobRecord>): JobRecord => ({
  jobId: 'job-1',
  kind: 'generate',
  documentType: 'document',
  contour: 'test-stand',
  state: 'preview',
  profileVersionId: null,
  seed: 'stand-24',
  requestedCount: 2,
  publishedCount: 0,
  quarantineCount: 0,
  reason: null,
  createdAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  checkpointDocumentNumber: 0,
  targetIndex: 'documents-synthetic',
  generatedAt: null,
  ...overrides,
});

describe('ListJobsHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new ListJobsHandler(store);

  beforeEach(() => {
    inMemoryDatabase.jobs.clear();
  });

  it('should_return_jobs_newest_first', async () => {
    await store.saveJob(
      job({ jobId: 'old', createdAt: '2026-01-01T00:00:00Z' }),
    );
    await store.saveJob(
      job({ jobId: 'new', createdAt: '2026-09-27T10:00:00Z' }),
    );
    const result = await handler.execute({ contour: 'test-stand' });
    expect(result.items.map((item) => item.jobId)).toEqual(['new', 'old']);
    expect(result.items[0]?.createdAt).toBe('2026-09-27T10:00:00Z');
  });
});
