import { isTerminalJobState } from './is-terminal-job-state';

describe('isTerminalJobState', () => {
  it('should_treat_only_succeeded_failed_cancelled_as_final', () => {
    expect(isTerminalJobState('succeeded')).toBe(true);
    expect(isTerminalJobState('failed')).toBe(true);
    expect(isTerminalJobState('cancelled')).toBe(true);
    expect(isTerminalJobState('preview')).toBe(false);
    expect(isTerminalJobState('canary')).toBe(false);
    expect(isTerminalJobState('accepted')).toBe(false);
  });
});
