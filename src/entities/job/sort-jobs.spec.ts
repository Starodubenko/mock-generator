import { sortJobsByCreatedAt } from './sort-jobs';

describe('sortJobsByCreatedAt', () => {
  it('should_rank_newest_first_and_break_ties_by_id', () => {
    expect(
      sortJobsByCreatedAt([
        { jobId: 'old', createdAt: '2026-01-01T00:00:00Z' },
        { jobId: 'mid-b', createdAt: '2026-09-27T10:00:00Z' },
        { jobId: 'mid-a', createdAt: '2026-09-27T10:00:00Z' },
        { jobId: 'new', createdAt: '2026-09-27T18:00:00Z' },
      ]).map((item) => item.jobId),
    ).toEqual(['new', 'mid-b', 'mid-a', 'old']);
  });
});
