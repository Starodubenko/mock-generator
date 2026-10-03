import { formatProfileVersionLabel } from './profile-version-label';

describe('formatProfileVersionLabel', () => {
  it('should_join_version_and_alias', () => {
    expect(
      formatProfileVersionLabel({ versionId: '3bfbf9eb', label: 'стенд' }),
    ).toBe('3bfbf9eb — стенд');
    expect(
      formatProfileVersionLabel({
        versionId: '3bfbf9eb',
        label: 'стенд',
        active: true,
      }),
    ).toBe('3bfbf9eb — стенд (активна)');
    expect(
      formatProfileVersionLabel({ versionId: '3bfbf9eb', active: true }),
    ).toBe('3bfbf9eb (активна)');
  });
});
