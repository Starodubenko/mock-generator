import type { PathClass, ProfileVersion } from './profile.types';

export type MappingView = {
  index: string;
  fields: Array<{ path: string; type: string }>;
};

const compatible = (pathClass: PathClass, mappingType: string): boolean => {
  if (mappingType === 'date') {
    return pathClass === 'datetime';
  }
  if (mappingType === 'boolean') {
    return pathClass === 'boolean';
  }
  if (
    mappingType === 'long' ||
    mappingType === 'integer' ||
    mappingType === 'double'
  ) {
    return pathClass === 'number-string';
  }
  return pathClass !== 'rejected';
};

export const applyMapping = (
  version: ProfileVersion,
  mapping: MappingView,
): ProfileVersion => {
  const fields = new Map(mapping.fields.map((field) => [field.path, field]));
  const paths = version.paths.map((stats) => {
    const field = fields.get(stats.path);
    if (!field || stats.pathClass === 'rejected') {
      return stats;
    }
    if (!compatible(stats.pathClass, field.type)) {
      return { ...stats, pathClass: 'rejected' as const };
    }
    return stats;
  });
  const rejectedCount = paths.filter(
    (item) => item.pathClass === 'rejected',
  ).length;
  return {
    ...version,
    mappingIndex: mapping.index,
    paths,
    activatable: version.activatable && rejectedCount === 0,
  };
};
