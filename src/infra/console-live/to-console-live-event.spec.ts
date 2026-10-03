import {
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
} from '@entities/console-live/console-live.contract';
import { toConsoleLiveEvent } from './to-console-live-event';
import type { JobRecord } from '@entities/job/job.types';

const job = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  jobId: 'job-1',
  kind: 'generate',
  documentType: 'document',
  contour: 'test-stand',
  state: 'canary',
  profileVersionId: 'c3ebc03a',
  seed: 'stand-24',
  requestedCount: 5,
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

describe('toConsoleLiveEvent', () => {
  it('should_omit_seed_target_and_document_fields', () => {
    const event = toConsoleLiveEvent(job(), 5);
    expect(event).toEqual({
      type: ConsoleLiveEventName.JobChanged,
      jobId: 'job-1',
      contour: 'test-stand',
      kind: ConsoleLiveJobKind.Generate,
      state: ConsoleLiveJobState.Canary,
      reason: null,
      publishedCount: 0,
      quarantineCount: 0,
      requestedCount: 5,
      draftCount: 5,
      profileVersionId: 'c3ebc03a',
    });
    expect(JSON.stringify(event)).not.toContain('stand-24');
    expect(JSON.stringify(event)).not.toContain('documents-synthetic');
    expect(JSON.stringify(event)).not.toContain('body');
  });
});
