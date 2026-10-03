import { sortProfileVersionsByCreatedAt } from './sort-profile-versions';

describe('sortProfileVersionsByCreatedAt', () => {
  it('should_rank_newest_first_and_break_ties_by_id', () => {
    expect(
      sortProfileVersionsByCreatedAt([
        { versionId: 'old', createdAt: '2026-01-01T00:00:00Z' },
        { versionId: 'mid-b', createdAt: '2026-09-27T10:00:00Z' },
        { versionId: 'mid-a', createdAt: '2026-09-27T10:00:00Z' },
        { versionId: 'new', createdAt: '2026-09-27T18:00:00Z' },
      ]).map((item) => item.versionId),
    ).toEqual(['new', 'mid-b', 'mid-a', 'old']);
  });
});
