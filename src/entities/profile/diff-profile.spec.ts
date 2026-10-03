import { diffProfiles } from './diff-profile';
import type { ProfileVersion } from './profile.types';

const mkVersion = (
  versionId: string,
  paths: ProfileVersion['paths'],
): ProfileVersion => ({
  versionId,
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths,
});

describe('diffProfiles', () => {
  it('should_treat_type_change_as_typeChanged', () => {
    const from = mkVersion('a', [
      {
        path: 'status',
        pathClass: 'category',
        presenceRate: 1,
        nullRate: 0,
        emptyStringRate: 0,
        emptyArrayRate: 0,
        emptyObjectRate: 0,
        cardinality: 2,
        missingKeyRate: 0,
        categoryValues: ['NEW'],
      },
    ]);
    const to = mkVersion('b', [
      {
        path: 'status',
        pathClass: 'free-text',
        presenceRate: 1,
        nullRate: 0,
        emptyStringRate: 0,
        emptyArrayRate: 0,
        emptyObjectRate: 0,
        cardinality: 2,
        missingKeyRate: 0,
      },
    ]);
    const diff = diffProfiles(from, to);
    expect(diff.typeChanged).toContain('status');
  });

  it('should_keep_missing_path_by_hysteresis_on_short_window', () => {
    const from = mkVersion('a', [
      {
        path: 'level',
        pathClass: 'category',
        presenceRate: 0.4,
        nullRate: 0,
        emptyStringRate: 0,
        emptyArrayRate: 0,
        emptyObjectRate: 0,
        cardinality: 2,
        missingKeyRate: 0.6,
        categoryValues: ['LOW'],
      },
    ]);
    const to = {
      ...mkVersion('b', []),
      sampleDocumentCount: 3,
    };
    const diff = diffProfiles(from, to, {
      shortWindowThreshold: 10,
      presenceDropThreshold: 0.05,
    });
    expect(diff.keptByHysteresis).toContain('level');
    expect(diff.removed).not.toContain('level');
  });
});
