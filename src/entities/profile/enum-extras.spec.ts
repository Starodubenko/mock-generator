import { applyEnumExtras, mergeCategoryValues } from './enum-extras';
import type { ProfileVersion } from './profile.types';

const version = (categoryValues?: string[]): ProfileVersion => ({
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths: [
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
      categoryValues,
    },
    {
      path: 'amount',
      pathClass: 'number-string',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    },
  ],
});

describe('enum-extras', () => {
  it('should_append_unknown_values_and_keep_trained_order', () => {
    expect(mergeCategoryValues(['type-a', 'type-b'], ['type-b', 'type-c'])).toEqual(
      ['type-a', 'type-b', 'type-c'],
    );
  });

  it('should_merge_only_category_paths_and_keep_version_id', () => {
    const trained = version(['type-a']);
    const merged = applyEnumExtras(trained, {
      status: ['type-c'],
      amount: ['no'],
    });
    expect(merged.versionId).toBe('v1');
    expect(merged.paths[0]?.categoryValues).toEqual(['type-a', 'type-c']);
    expect(merged.paths[1]?.categoryValues).toBeUndefined();
    expect(trained.paths[0]?.categoryValues).toEqual(['type-a']);
  });
});
