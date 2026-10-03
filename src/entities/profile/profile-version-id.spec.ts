import { computeProfileVersionId } from './profile-version-id';
import type { PathStats } from './profile.types';

const path = (name: string, pathClass: PathStats['pathClass']): PathStats => ({
  path: name,
  pathClass,
  presenceRate: 1,
  nullRate: 0,
  emptyStringRate: 0,
  emptyArrayRate: 0,
  emptyObjectRate: 0,
  cardinality: 1,
  missingKeyRate: 0,
});

describe('computeProfileVersionId', () => {
  it('should_be_stable_for_the_same_content_and_change_when_a_class_changes', () => {
    const base = {
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit',
      paths: [path('status', 'category')],
      aliases: [] as Array<{ from: string; to: string }>,
    };
    const first = computeProfileVersionId(base);
    expect(first).toHaveLength(8);
    expect(computeProfileVersionId(base)).toBe(first);
    expect(
      computeProfileVersionId({
        ...base,
        paths: [path('status', 'free-text')],
      }),
    ).not.toBe(first);
  });
});
