import { ConsoleLiveEventName } from '@entities/console-live/console-live.contract';
import type { JobRecord } from '@entities/job/job.types';
import type { ProcessStore } from '@repositories/process-store.port';
import { emitJobChanged } from './emit-job-changed';

const job = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  jobId: 'job-live-1',
  kind: 'generate',
  documentType: 'document',
  contour: 'test-stand',
  state: 'preview',
  profileVersionId: 'c3ebc03a',
  seed: 'stand-24',
  requestedCount: 2,
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

describe('emitJobChanged', () => {
  it('should_publish_counts_without_document_bodies', async () => {
    const publish = jest.fn();
    const store = {
      getDraftDocuments: jest.fn(() =>
        Promise.resolve([
          { id: 'd1', body: { id: 'secret-doc', status: 'NEW' } },
        ]),
      ),
    } as unknown as ProcessStore;
    await emitJobChanged({ publish }, store, job());
    expect(publish).toHaveBeenCalledTimes(1);
    const published = publish.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    const event = published[0]?.[0] ?? {};
    expect(event.type).toBe(ConsoleLiveEventName.JobChanged);
    expect(event.draftCount).toBe(1);
    expect(JSON.stringify(event)).not.toContain('secret-doc');
    expect(JSON.stringify(event)).not.toContain('stand-24');
    expect(event.body).toBeUndefined();
  });

  it('should_skip_when_hub_is_missing', async () => {
    const getDraftDocuments = jest.fn();
    const store = {
      getDraftDocuments,
    } as unknown as ProcessStore;
    await emitJobChanged(undefined, store, job());
    expect(getDraftDocuments).not.toHaveBeenCalled();
  });
});
