import { clampJobListPage, rankJobs, sliceJobListPage } from './rank-jobs';

describe('rankJobs', () => {
  it('should_put_newer_jobs_first', () => {
    expect(
      rankJobs([
        { jobId: 'aaaa1111', createdAt: '2026-01-01T00:00:00Z' },
        { jobId: 'bbbb2222', createdAt: '2026-09-27T10:00:00Z' },
      ]).map((item) => item.jobId),
    ).toEqual(['bbbb2222', 'aaaa1111']);
  });

  it('should_treat_missing_createdAt_as_newest', () => {
    expect(
      rankJobs([
        { jobId: 'old', createdAt: '2026-01-01T00:00:00Z' },
        { jobId: 'live', createdAt: '' },
      ]).map((item) => item.jobId),
    ).toEqual(['live', 'old']);
  });
});

describe('sliceJobListPage', () => {
  it('should_keep_newest_on_first_page', () => {
    const items = rankJobs([
      { jobId: 'old', createdAt: '2026-01-01T00:00:00Z' },
      { jobId: 'mid', createdAt: '2026-06-01T00:00:00Z' },
      { jobId: 'new', createdAt: '2026-09-27T10:00:00Z' },
    ]);
    expect(sliceJobListPage(items, 0, 2).map((item) => item.jobId)).toEqual([
      'new',
      'mid',
    ]);
    expect(sliceJobListPage(items, 1, 2).map((item) => item.jobId)).toEqual([
      'old',
    ]);
  });

  it('should_clamp_page_past_the_end', () => {
    expect(clampJobListPage(9, 12, 10)).toBe(1);
    expect(clampJobListPage(-1, 12, 10)).toBe(0);
  });
});
