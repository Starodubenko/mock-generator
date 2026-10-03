import type { FailReason } from '../job/fail-reason';

export enum ConsoleLiveChannel {
  Path = '/console/live',
}

export enum ConsoleLiveEventName {
  JobChanged = 'job.changed',
}

export enum ConsoleLiveJobKind {
  Train = 'train',
  Generate = 'generate',
}

export enum ConsoleLiveJobState {
  Accepted = 'accepted',
  Profiling = 'profiling',
  ProfileReady = 'profile_ready',
  Activating = 'activating',
  Preview = 'preview',
  Canary = 'canary',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum ConsoleLiveForbiddenField {
  Body = 'body',
  Documents = 'documents',
  Token = 'token',
  Authorization = 'authorization',
  Bearer = 'bearer',
  IndexerBaseUrl = 'INDEXER_BASE_URL',
  Seed = 'seed',
  TargetIndex = 'targetIndex',
}

export const CONSOLE_LIVE_FALLBACK_MS = 3000;

export const CONSOLE_LIVE_REPLAY_LIMIT = 200;

export const CONSOLE_LIVE_JOB_KIND_VALUES = new Set<string>(
  Object.values(ConsoleLiveJobKind),
);

export const CONSOLE_LIVE_JOB_STATE_VALUES = new Set<string>(
  Object.values(ConsoleLiveJobState),
);

export const CONSOLE_LIVE_FORBIDDEN_FIELDS = new Set<string>(
  Object.values(ConsoleLiveForbiddenField),
);

export const CONSOLE_LIVE_TERMINAL_STATES = new Set<string>([
  ConsoleLiveJobState.Succeeded,
  ConsoleLiveJobState.Failed,
  ConsoleLiveJobState.Cancelled,
]);

export const isTerminalConsoleLiveState = (state: string): boolean =>
  CONSOLE_LIVE_TERMINAL_STATES.has(state);

export const isConsoleLiveKind = (
  kind: string,
  expected: ConsoleLiveJobKind,
): boolean => kind === String(expected);

export const isConsoleLiveChannelPath = (path: string): boolean =>
  path === String(ConsoleLiveChannel.Path);

export type ConsoleLiveJobEvent = {
  type: ConsoleLiveEventName.JobChanged;
  jobId: string;
  contour: string;
  kind: ConsoleLiveJobKind;
  state: ConsoleLiveJobState;
  reason: FailReason | null;
  publishedCount: number;
  quarantineCount: number;
  requestedCount: number | null;
  draftCount: number;
  profileVersionId: string | null;
};

export type ConsoleLiveEvent = ConsoleLiveJobEvent;
