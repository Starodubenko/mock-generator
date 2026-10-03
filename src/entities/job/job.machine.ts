import { assign, getNextSnapshot, setup } from 'xstate';
import type { FailReason } from './fail-reason';
import type { JobKind, JobState } from './job.types';

export type JobMachineContext = {
  kind: JobKind;
  reason: FailReason | null;
};

export type JobMachineEvent =
  | { type: 'START_PROFILING' }
  | { type: 'PROFILE_READY' }
  | { type: 'START_PREVIEW' }
  | { type: 'START_CANARY' }
  | { type: 'START_RUNNING' }
  | { type: 'SUCCEED' }
  | { type: 'FAIL'; reason: FailReason }
  | { type: 'CANCEL' };

export const jobMachine = setup({
  types: {
    context: {} as JobMachineContext,
    events: {} as JobMachineEvent,
    input: {} as JobMachineContext,
  },
}).createMachine({
  id: 'job',
  initial: 'accepted',
  context: ({ input }) => ({
    kind: input.kind,
    reason: null,
  }),
  states: {
    accepted: {
      on: {
        START_PROFILING: {
          target: 'profiling',
          guard: ({ context }) => context.kind === 'train',
        },
        START_PREVIEW: {
          target: 'preview',
          guard: ({ context }) => context.kind === 'generate',
        },
        START_CANARY: {
          target: 'canary',
          guard: ({ context }) => context.kind === 'generate',
        },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    preview: {
      on: {
        START_CANARY: {
          target: 'canary',
          guard: ({ context }) => context.kind === 'generate',
        },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    profiling: {
      on: {
        PROFILE_READY: { target: 'profile_ready' },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    profile_ready: {
      on: {
        SUCCEED: { target: 'succeeded' },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    activating: {
      on: {
        SUCCEED: { target: 'succeeded' },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    canary: {
      on: {
        START_RUNNING: { target: 'running' },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    running: {
      on: {
        SUCCEED: { target: 'succeeded' },
        FAIL: {
          target: 'failed',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
        CANCEL: { target: 'cancelled' },
      },
    },
    succeeded: { type: 'final' },
    failed: { type: 'final' },
    cancelled: { type: 'final' },
  },
});

export const transitionJobState = (
  current: JobState,
  kind: JobKind,
  event: JobMachineEvent,
): { state: JobState; reason: FailReason | null } | null => {
  const snapshot = jobMachine.resolveState({
    value: current,
    context: { kind, reason: null },
  });
  const next = getNextSnapshot(jobMachine, snapshot, event);
  const nextState = String(next.value) as JobState;
  if (nextState === current) {
    return null;
  }
  const reason =
    next.context.reason ?? (event.type === 'FAIL' ? event.reason : null);
  return { state: nextState, reason };
};

export const isTerminalJobState = (state: JobState): boolean =>
  state === 'succeeded' || state === 'failed' || state === 'cancelled';
