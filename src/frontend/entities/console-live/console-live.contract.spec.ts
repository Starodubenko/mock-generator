import {
  CONSOLE_LIVE_FALLBACK_MS,
  CONSOLE_LIVE_REPLAY_LIMIT,
  ConsoleLiveChannel,
  ConsoleLiveConnectionState,
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
  isTerminalConsoleLiveState,
} from './console-live.contract';
import { parseConsoleLiveEvent } from './parse-console-live-event';

describe('frontend console-live contract', () => {
  it('should_mirror_backend_wire_tokens', () => {
    expect(ConsoleLiveChannel.Path).toBe('/console/live');
    expect(ConsoleLiveEventName.JobChanged).toBe('job.changed');
    expect(ConsoleLiveConnectionState.Live).toBe('live');
    expect(CONSOLE_LIVE_FALLBACK_MS).toBe(3000);
    expect(CONSOLE_LIVE_REPLAY_LIMIT).toBe(200);
    expect(isTerminalConsoleLiveState(ConsoleLiveJobState.Preview)).toBe(false);
  });

  it('should_reject_document_bodies', () => {
    const valid = {
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
    };
    expect(parseConsoleLiveEvent(JSON.stringify(valid))).toEqual(valid);
    expect(
      parseConsoleLiveEvent(JSON.stringify({ ...valid, body: { id: 'x' } })),
    ).toBeNull();
  });
});
