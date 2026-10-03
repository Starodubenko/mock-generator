import { setup } from 'xstate';

export const jobStatusPollMachine = setup({
  types: {
    context: {} as { jobId: string },
    events: {} as { type: 'START' } | { type: 'STOP' } | { type: 'TICK' },
    input: {} as { jobId: string },
  },
}).createMachine({
  id: 'jobStatusPoll',
  initial: 'idle',
  context: ({ input }) => ({ jobId: input.jobId }),
  states: {
    idle: {
      on: { START: 'polling' },
    },
    polling: {
      on: {
        TICK: 'polling',
        STOP: 'idle',
      },
    },
  },
});
