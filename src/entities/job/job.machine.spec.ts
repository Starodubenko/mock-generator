import { transitionJobState } from './job.machine';

describe('jobMachine transitions', () => {
  it('should_move_train_job_from_accepted_to_profiling', () => {
    const result = transitionJobState('accepted', 'train', {
      type: 'START_PROFILING',
    });
    expect(result).toEqual({ state: 'profiling', reason: null });
  });

  it('should_move_generate_job_from_accepted_to_preview', () => {
    const result = transitionJobState('accepted', 'generate', {
      type: 'START_PREVIEW',
    });
    expect(result).toEqual({ state: 'preview', reason: null });
  });

  it('should_move_preview_to_canary_on_publish', () => {
    const result = transitionJobState('preview', 'generate', {
      type: 'START_CANARY',
    });
    expect(result).toEqual({ state: 'canary', reason: null });
  });

  it('should_not_return_running_from_succeeded', () => {
    const result = transitionJobState('succeeded', 'generate', {
      type: 'START_RUNNING',
    });
    expect(result).toBeNull();
  });

  it('should_fail_generate_job_with_reason', () => {
    const result = transitionJobState('canary', 'generate', {
      type: 'FAIL',
      reason: 'canary_failed',
    });
    expect(result).toEqual({ state: 'failed', reason: 'canary_failed' });
  });
});
