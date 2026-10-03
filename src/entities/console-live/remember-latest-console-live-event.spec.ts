import {
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
  type ConsoleLiveJobEvent,
} from './console-live.contract';
import { rememberLatestConsoleLiveEvent } from './remember-latest-console-live-event';

const event = (
  overrides: Partial<ConsoleLiveJobEvent> = {},
): ConsoleLiveJobEvent => ({
  type: ConsoleLiveEventName.JobChanged,
  jobId: 'job-1',
  contour: 'test-stand',
  kind: ConsoleLiveJobKind.Generate,
  state: ConsoleLiveJobState.Accepted,
  reason: null,
  publishedCount: 0,
  quarantineCount: 0,
  requestedCount: 2,
  draftCount: 0,
  profileVersionId: 'c3ebc03a',
  ...overrides,
});

describe('rememberLatestConsoleLiveEvent', () => {
  it('should_keep_only_the_latest_event_per_job', () => {
    const latest = new Map<string, ConsoleLiveJobEvent>();
    rememberLatestConsoleLiveEvent(latest, event());
    const snapshot = rememberLatestConsoleLiveEvent(
      latest,
      event({ state: ConsoleLiveJobState.Preview, draftCount: 2 }),
    );
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.state).toBe(ConsoleLiveJobState.Preview);
    expect(snapshot[0]?.draftCount).toBe(2);
  });

  it('should_evict_the_oldest_job_when_over_limit', () => {
    const latest = new Map<string, ConsoleLiveJobEvent>();
    rememberLatestConsoleLiveEvent(latest, event({ jobId: 'old' }), 2);
    rememberLatestConsoleLiveEvent(latest, event({ jobId: 'mid' }), 2);
    rememberLatestConsoleLiveEvent(latest, event({ jobId: 'new' }), 2);
    expect([...latest.keys()]).toEqual(['mid', 'new']);
  });
});
