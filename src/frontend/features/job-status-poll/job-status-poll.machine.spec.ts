import { createActor } from 'xstate';
import { jobStatusPollMachine } from './job-status-poll.machine';

describe('jobStatusPollMachine', () => {
  it('should_enter_polling_on_start', () => {
    const actor = createActor(jobStatusPollMachine, {
      input: { jobId: 'job-1' },
    });
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('polling');
  });
});
