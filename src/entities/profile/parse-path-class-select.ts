import type { DatetimeFormat, PathClass } from './profile.types';

export const PATH_CLASS_SELECT_VALUES = [
  'category',
  'free-text',
  'identifier',
  'pattern',
  'number-string',
  'datetime:date',
  'datetime:date-time',
  'boolean',
  'nested',
  'array',
  'open-map',
  'rejected',
] as const;

export type PathClassSelectValue = (typeof PATH_CLASS_SELECT_VALUES)[number];

export type ParsedPathClassSelect = {
  pathClass: PathClass;
  datetimeFormat?: DatetimeFormat;
  itemPathClass?: PathClass;
  itemDatetimeFormat?: DatetimeFormat;
};

const PATH_CLASSES = new Set<PathClass>([
  'category',
  'pattern',
  'number-string',
  'datetime',
  'boolean',
  'identifier',
  'free-text',
  'nested',
  'array',
  'open-map',
  'rejected',
]);

export const toPathClassSelectValue = (
  pathClass: string,
  datetimeFormat?: string,
  itemPathClass?: string,
  itemDatetimeFormat?: string,
): string => {
  if (pathClass === 'datetime') {
    return datetimeFormat === 'date' ? 'datetime:date' : 'datetime:date-time';
  }
  if (pathClass === 'array') {
    const item = toPathClassSelectValue(
      itemPathClass ?? 'free-text',
      itemDatetimeFormat,
    );
    return item.startsWith('array') ? 'array:free-text' : `array:${item}`;
  }
  if (PATH_CLASS_SELECT_VALUES.includes(pathClass as PathClassSelectValue)) {
    return pathClass;
  }
  return 'free-text';
};

export const parsePathClassSelectValue = (
  value: string,
): ParsedPathClassSelect | null => {
  if (value === 'datetime:date') {
    return { pathClass: 'datetime', datetimeFormat: 'date' };
  }
  if (value === 'datetime:date-time') {
    return { pathClass: 'datetime', datetimeFormat: 'date-time' };
  }
  if (value === 'array' || value === 'array:array') {
    return { pathClass: 'array', itemPathClass: 'free-text' };
  }
  if (value.startsWith('array:')) {
    const item = parsePathClassSelectValue(value.slice('array:'.length));
    if (!item || item.pathClass === 'array') {
      return { pathClass: 'array', itemPathClass: 'free-text' };
    }
    return {
      pathClass: 'array',
      itemPathClass: item.pathClass,
      itemDatetimeFormat: item.datetimeFormat,
    };
  }
  if (PATH_CLASSES.has(value as PathClass)) {
    return { pathClass: value as PathClass };
  }
  return null;
};
