import { rememberLatestJobEvent } from './remember-latest-job-event';

describe('rememberLatestJobEvent', () => {
  it('should_evict_the_oldest_job_when_over_limit', () => {
    const latest = new Map<string, { jobId: string }>();
    rememberLatestJobEvent(latest, { jobId: 'old' }, 2);
    rememberLatestJobEvent(latest, { jobId: 'mid' }, 2);
    rememberLatestJobEvent(latest, { jobId: 'new' }, 2);
    expect([...latest.keys()]).toEqual(['mid', 'new']);
  });
});
