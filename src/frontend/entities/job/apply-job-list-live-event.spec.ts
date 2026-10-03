import {
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
} from '../console-live/console-live.contract';
import { applyJobListLiveEvent } from './apply-job-list-live-event';

const event = {
  type: ConsoleLiveEventName.JobChanged,
  jobId: 'job-new',
  contour: 'test-stand',
  kind: ConsoleLiveJobKind.Generate,
  state: ConsoleLiveJobState.Preview,
  reason: null,
  publishedCount: 0,
  quarantineCount: 0,
  requestedCount: 2,
  draftCount: 2,
  profileVersionId: null,
};

describe('applyJobListLiveEvent', () => {
  it('should_insert_unknown_job_as_newest', () => {
    const result = applyJobListLiveEvent(
      [
        {
          jobId: 'job-old',
          kind: 'train',
          state: 'succeeded',
          createdAt: '2026-01-01T00:00:00Z',
          documentType: 'document',
          requestedCount: null,
        },
      ],
      event,
      'test-stand',
    );
    expect(result.isNew).toBe(true);
    expect(result.rows.map((row) => row.jobId)).toEqual(['job-new', 'job-old']);
  });

  it('should_keep_createdAt_when_updating_state', () => {
    const result = applyJobListLiveEvent(
      [
        {
          jobId: 'job-new',
          kind: 'generate',
          state: 'accepted',
          createdAt: '2026-09-27T10:00:00Z',
          documentType: 'document',
          requestedCount: 2,
        },
      ],
      event,
      'test-stand',
    );
    expect(result.isNew).toBe(false);
    expect(result.rows[0]?.createdAt).toBe('2026-09-27T10:00:00Z');
    expect(result.rows[0]?.state).toBe(ConsoleLiveJobState.Preview);
  });

  it('should_ignore_other_contour', () => {
    const current = [
      {
        jobId: 'job-old',
        kind: 'train',
        state: 'succeeded',
        createdAt: '2026-01-01T00:00:00Z',
        documentType: 'document',
        requestedCount: null,
      },
    ];
    const result = applyJobListLiveEvent(
      current,
      { ...event, contour: 'other' },
      'test-stand',
    );
    expect(result.rows).toBe(current);
    expect(result.isNew).toBe(false);
  });
});
