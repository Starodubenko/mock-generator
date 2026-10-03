import type { ProfileVersion } from './profile.types';

export const mergeCategoryValues = (
  trained: string[] | undefined,
  extra: string[] | undefined,
): string[] => {
  const merged = [...(trained ?? [])];
  for (const value of extra ?? []) {
    if (!merged.includes(value)) {
      merged.push(value);
    }
  }
  return merged;
};

export const applyEnumExtras = (
  version: ProfileVersion,
  extras: Record<string, string[]>,
): ProfileVersion => ({
  ...version,
  paths: version.paths.map((item) => {
    if (item.pathClass !== 'category') {
      return item;
    }
    const added = extras[item.path];
    if (!added || added.length === 0) {
      return item;
    }
    return {
      ...item,
      categoryValues: mergeCategoryValues(item.categoryValues, added),
    };
  }),
});
