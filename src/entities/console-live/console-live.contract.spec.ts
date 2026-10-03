import {
  CONSOLE_LIVE_FALLBACK_MS,
  CONSOLE_LIVE_FORBIDDEN_FIELDS,
  CONSOLE_LIVE_REPLAY_LIMIT,
  ConsoleLiveChannel,
  ConsoleLiveEventName,
  ConsoleLiveForbiddenField,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
  isTerminalConsoleLiveState,
} from './console-live.contract';
import * as frontendWire from '@frontend/entities/console-live/console-live.contract';
import {
  parseConsoleLiveEvent,
  serializeConsoleLiveEvent,
} from './parse-console-live-event';

describe('console-live contract', () => {
  it('should_keep_wire_tokens_in_enums', () => {
    expect(ConsoleLiveChannel.Path).toBe('/console/live');
    expect(ConsoleLiveEventName.JobChanged).toBe('job.changed');
    expect(ConsoleLiveJobKind.Train).toBe('train');
    expect(ConsoleLiveJobKind.Generate).toBe('generate');
    expect(CONSOLE_LIVE_FALLBACK_MS).toBe(3000);
    expect(CONSOLE_LIVE_REPLAY_LIMIT).toBe(200);
    expect(
      CONSOLE_LIVE_FORBIDDEN_FIELDS.has(ConsoleLiveForbiddenField.Body),
    ).toBe(true);
    expect(isTerminalConsoleLiveState(ConsoleLiveJobState.Preview)).toBe(false);
    expect(isTerminalConsoleLiveState(ConsoleLiveJobState.Succeeded)).toBe(
      true,
    );
  });

  it('should_round_trip_job_changed_without_document_fields', () => {
    const event = {
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
    const raw = serializeConsoleLiveEvent(event);
    expect(raw).not.toContain('body');
    expect(parseConsoleLiveEvent(raw)).toEqual(event);
    expect(
      parseConsoleLiveEvent(JSON.stringify({ ...event, body: { id: 'x' } })),
    ).toBeNull();
  });

  it('should_mirror_wire_enums_on_the_frontend', () => {
    expect(frontendWire.ConsoleLiveChannel.Path).toBe(ConsoleLiveChannel.Path);
    expect(frontendWire.ConsoleLiveEventName.JobChanged).toBe(
      ConsoleLiveEventName.JobChanged,
    );
    expect(frontendWire.CONSOLE_LIVE_FALLBACK_MS).toBe(
      CONSOLE_LIVE_FALLBACK_MS,
    );
    expect(frontendWire.CONSOLE_LIVE_REPLAY_LIMIT).toBe(
      CONSOLE_LIVE_REPLAY_LIMIT,
    );
    expect(Object.values(frontendWire.ConsoleLiveJobKind)).toEqual(
      Object.values(ConsoleLiveJobKind),
    );
    expect(Object.values(frontendWire.ConsoleLiveJobState)).toEqual(
      Object.values(ConsoleLiveJobState),
    );
    expect(Object.values(frontendWire.ConsoleLiveForbiddenField)).toEqual(
      Object.values(ConsoleLiveForbiddenField),
    );
  });
});
