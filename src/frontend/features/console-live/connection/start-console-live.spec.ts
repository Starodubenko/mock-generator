import { ConsoleLiveConnectionState } from '@frontend/entities/console-live/console-live.contract';
import { getConsoleLiveStatus, setConsoleLiveStatus } from './console-live.bus';
import {
  resetConsoleLiveConnectionForTests,
  startConsoleLiveConnection,
} from './start-console-live';

describe('startConsoleLiveConnection', () => {
  const previousWindow = globalThis.window;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { protocol: 'http:', host: '127.0.0.1:3000' } },
    });
  });

  afterEach(() => {
    setConsoleLiveStatus(ConsoleLiveConnectionState.Idle);
    resetConsoleLiveConnectionForTests();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    });
  });

  it('should_mark_live_on_open_and_fallback_on_close', () => {
    const listeners = new Map<string, Array<(event: Event) => unknown>>();
    startConsoleLiveConnection(() => ({
      addEventListener: (type, listener) => {
        if (typeof listener !== 'function') {
          return;
        }
        const bucket = listeners.get(type) ?? [];
        bucket.push(listener as (event: Event) => unknown);
        listeners.set(type, bucket);
      },
    }));
    const event = { type: 'test', target: null } as Event;
    expect(getConsoleLiveStatus()).toBe(ConsoleLiveConnectionState.Connecting);
    listeners.get('open')?.[0]?.(event);
    expect(getConsoleLiveStatus()).toBe(ConsoleLiveConnectionState.Live);
    listeners.get('close')?.[0]?.(event);
    expect(getConsoleLiveStatus()).toBe(ConsoleLiveConnectionState.Fallback);
  });
});
