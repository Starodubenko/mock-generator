import type { ProfileVersion } from '@entities/profile/profile.types';
import { profileFromWire, profileToWire } from './profile-wire';

describe('profile-wire', () => {
  it('should_rebuild_fingerprint_set', () => {
    expect(
      profileFromWire({
        versionId: 'v1',
        corpusValueFingerprints: ['aa', 1, 'bb'],
      })?.corpusValueFingerprints,
    ).toEqual(new Set(['aa', 'bb']));
  });

  it('should_send_fingerprints_as_array', () => {
    const version: ProfileVersion = {
      versionId: 'v1',
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit',
      createdAt: '2026-01-01T00:00:00Z',
      mappingIndex: 'documents-synthetic',
      paths: [],
      aliases: [],
      corpusValueFingerprints: new Set(['aa', 'bb']),
      sampleDocumentCount: 1,
      activatable: true,
    };
    expect(profileToWire(version).corpusValueFingerprints).toEqual([
      'aa',
      'bb',
    ]);
  });
});
