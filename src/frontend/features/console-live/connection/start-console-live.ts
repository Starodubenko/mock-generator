import ReconnectingWebSocket from 'reconnecting-websocket';
import {
  CONSOLE_LIVE_FALLBACK_MS,
  ConsoleLiveConnectionState,
} from '@frontend/entities/console-live/console-live.contract';
import { parseConsoleLiveEvent } from '@frontend/entities/console-live/parse-console-live-event';
import { buildConsoleLiveUrl } from './build-console-live-url';
import { dispatchConsoleLive, setConsoleLiveStatus } from './console-live.bus';

type LiveSocket = Pick<ReconnectingWebSocket, 'addEventListener'>;

let socket: LiveSocket | null = null;

export const resetConsoleLiveConnectionForTests = (): void => {
  socket = null;
};

export const startConsoleLiveConnection = (
  createSocket: (url: string) => LiveSocket = (url) =>
    new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: CONSOLE_LIVE_FALLBACK_MS,
      minReconnectionDelay: 300,
      reconnectionDelayGrowFactor: 1.4,
      maxRetries: Infinity,
      connectionTimeout: CONSOLE_LIVE_FALLBACK_MS,
    }),
): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (socket) {
    return;
  }
  setConsoleLiveStatus(ConsoleLiveConnectionState.Connecting);
  const next = createSocket(buildConsoleLiveUrl(window.location));
  socket = next;
  next.addEventListener('open', () => {
    setConsoleLiveStatus(ConsoleLiveConnectionState.Live);
  });
  next.addEventListener('close', () => {
    setConsoleLiveStatus(ConsoleLiveConnectionState.Fallback);
  });
  next.addEventListener('error', () => {
    setConsoleLiveStatus(ConsoleLiveConnectionState.Fallback);
  });
  next.addEventListener('message', (event) => {
    const parsed = parseConsoleLiveEvent(String(event.data ?? ''));
    if (parsed) {
      dispatchConsoleLive(parsed);
    }
  });
};
