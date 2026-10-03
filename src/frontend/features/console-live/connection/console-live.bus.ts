import {
  ConsoleLiveConnectionState,
  type ConsoleLiveJobEvent,
} from '@frontend/entities/console-live/console-live.contract';
import { rememberLatestJobEvent } from '@frontend/entities/console-live/remember-latest-job-event';

type EventListener = (event: ConsoleLiveJobEvent) => void;
type StatusListener = (status: ConsoleLiveConnectionState) => void;

const eventListeners = new Set<EventListener>();
const statusListeners = new Set<StatusListener>();
const latestByJob = new Map<string, ConsoleLiveJobEvent>();
let status: ConsoleLiveConnectionState = ConsoleLiveConnectionState.Idle;

export const getConsoleLiveStatus = (): ConsoleLiveConnectionState => status;

export const isConsoleLive = (): boolean =>
  getConsoleLiveStatus() === ConsoleLiveConnectionState.Live;

export const setConsoleLiveStatus = (
  next: ConsoleLiveConnectionState,
): void => {
  status = next;
  for (const listener of statusListeners) {
    listener(next);
  }
};

export const subscribeConsoleLiveStatus = (
  listener: StatusListener,
): (() => void) => {
  listener(status);
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

export const dispatchConsoleLive = (event: ConsoleLiveJobEvent): void => {
  rememberLatestJobEvent(latestByJob, event);
  for (const listener of eventListeners) {
    listener(event);
  }
};

export const subscribeConsoleLive = (listener: EventListener): (() => void) => {
  for (const event of latestByJob.values()) {
    listener(event);
  }
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
};
