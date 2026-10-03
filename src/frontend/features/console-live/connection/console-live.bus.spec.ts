import {
  ConsoleLiveConnectionState,
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
} from '@frontend/entities/console-live/console-live.contract';
import {
  dispatchConsoleLive,
  getConsoleLiveStatus,
  isConsoleLive,
  setConsoleLiveStatus,
  subscribeConsoleLive,
  subscribeConsoleLiveStatus,
} from './console-live.bus';

const event = (
  overrides: Partial<Parameters<typeof dispatchConsoleLive>[0]> = {},
) => ({
  type: ConsoleLiveEventName.JobChanged,
  jobId: 'job-1',
  contour: 'test-stand',
  kind: ConsoleLiveJobKind.Generate,
  state: ConsoleLiveJobState.Preview,
  reason: null,
  publishedCount: 0,
  quarantineCount: 0,
  requestedCount: 2,
  draftCount: 2,
  profileVersionId: 'c3ebc03a',
  ...overrides,
});

describe('console-live bus', () => {
  afterEach(() => {
    setConsoleLiveStatus(ConsoleLiveConnectionState.Idle);
  });

  it('should_keep_status_in_memory', () => {
    expect(isConsoleLive()).toBe(false);
    setConsoleLiveStatus(ConsoleLiveConnectionState.Live);
    expect(getConsoleLiveStatus()).toBe(ConsoleLiveConnectionState.Live);
    expect(isConsoleLive()).toBe(true);
  });

  it('should_replay_latest_job_event_to_late_subscribers', () => {
    dispatchConsoleLive(
      event({ state: ConsoleLiveJobState.Accepted, draftCount: 0 }),
    );
    dispatchConsoleLive(event());
    const listener = jest.fn();
    const stop = subscribeConsoleLive(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    const replayed = listener.mock.calls as unknown as Array<
      [ReturnType<typeof event>]
    >;
    expect(replayed[0]?.[0].state).toBe(ConsoleLiveJobState.Preview);
    expect(replayed[0]?.[0].draftCount).toBe(2);
    stop();
  });

  it('should_replay_current_status_on_subscribe', () => {
    setConsoleLiveStatus(ConsoleLiveConnectionState.Live);
    const listener = jest.fn();
    const stop = subscribeConsoleLiveStatus(listener);
    expect(listener).toHaveBeenCalledWith(ConsoleLiveConnectionState.Live);
    stop();
  });
});
