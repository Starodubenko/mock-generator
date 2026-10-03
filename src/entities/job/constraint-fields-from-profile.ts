import type { DatetimeFormat, PathStats } from '../profile/profile.types';

export type ConstraintField = {
  path: string;
  kind: 'boolean' | 'category' | 'datetime';
  options: string[];
  datetimeFormat?: DatetimeFormat;
};

export const constraintFieldsFromProfile = (
  paths: Array<
    Pick<PathStats, 'path' | 'pathClass' | 'categoryValues' | 'datetimeFormat'>
  >,
): ConstraintField[] =>
  paths
    .filter(
      (item) =>
        item.pathClass === 'boolean' ||
        item.pathClass === 'category' ||
        item.pathClass === 'datetime',
    )
    .map((item) => {
      if (item.pathClass === 'boolean') {
        return {
          path: item.path,
          kind: 'boolean' as const,
          options: ['true', 'false'],
        };
      }
      if (item.pathClass === 'category') {
        return {
          path: item.path,
          kind: 'category' as const,
          options: item.categoryValues ?? [],
        };
      }
      return {
        path: item.path,
        kind: 'datetime' as const,
        options: [],
        datetimeFormat: item.datetimeFormat,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
