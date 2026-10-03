import { rankProfileVersions } from './rank-profile-versions';

describe('rankProfileVersions', () => {
  it('should_put_newer_versions_first', () => {
    expect(
      rankProfileVersions([
        { versionId: 'aaaa1111', createdAt: '2026-01-01T00:00:00Z' },
        { versionId: 'bbbb2222', createdAt: '2026-09-27T10:00:00Z' },
      ]).map((item) => item.versionId),
    ).toEqual(['bbbb2222', 'aaaa1111']);
  });
});
