import {
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
  type ConsoleLiveJobEvent,
} from '../console-live/console-live.contract';
import { applyJobLiveEvent } from './apply-job-live-event';

const current = {
  jobId: 'job-1',
  kind: 'generate',
  state: 'canary',
  reason: null,
  contour: 'test-stand',
  profileVersionId: 'c3ebc03a',
  publishedCount: 0,
  quarantineCount: 0,
  requestedCount: 5,
  draftCount: 5,
};

const event = (
  overrides: Partial<ConsoleLiveJobEvent> = {},
): ConsoleLiveJobEvent => ({
  type: ConsoleLiveEventName.JobChanged,
  jobId: 'job-1',
  contour: 'test-stand',
  kind: ConsoleLiveJobKind.Generate,
  state: ConsoleLiveJobState.Succeeded,
  reason: null,
  publishedCount: 5,
  quarantineCount: 0,
  requestedCount: 5,
  draftCount: 5,
  profileVersionId: 'c3ebc03a',
  ...overrides,
});

describe('applyJobLiveEvent', () => {
  it('should_update_state_and_published_count_for_the_same_job', () => {
    expect(applyJobLiveEvent(current, event())).toEqual({
      ...current,
      state: 'succeeded',
      publishedCount: 5,
    });
  });

  it('should_ignore_other_jobs', () => {
    expect(applyJobLiveEvent(current, event({ jobId: 'job-2' }))).toEqual(
      current,
    );
  });
});
