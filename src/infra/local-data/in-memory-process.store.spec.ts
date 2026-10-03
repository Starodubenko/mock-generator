import { ConsoleLiveEventName } from '@entities/console-live/console-live.contract';
import type { JobRecord } from '@entities/job/job.types';
import { InMemoryProcessStore } from './in-memory-process.store';

const job = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  jobId: 'job-store-live-1',
  kind: 'generate',
  documentType: 'document',
  contour: 'test-stand',
  state: 'preview',
  profileVersionId: 'c3ebc03a',
  seed: 'stand-24',
  requestedCount: 1,
  publishedCount: 0,
  quarantineCount: 0,
  reason: null,
  createdAt: '2026-09-27T17:00:00.000Z',
  finishedAt: null,
  checkpointDocumentNumber: 0,
  targetIndex: 'documents-synthetic',
  generatedAt: '2026-09-27T20:00:00+03:00',
  ...overrides,
});

describe('InMemoryProcessStore live notify', () => {
  it('should_emit_job_changed_after_save_job', async () => {
    const publish = jest.fn();
    const store = new InMemoryProcessStore({ publish });
    await store.saveDraftDocuments('job-store-live-1', [
      { id: 'd1', body: { status: 'NEW' } },
    ]);
    await store.saveJob(job());
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ConsoleLiveEventName.JobChanged,
        jobId: 'job-store-live-1',
        state: 'preview',
        draftCount: 1,
      }),
    );
  });
});
