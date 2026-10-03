import { DATE_ONLY, ISO_DATE_TIME } from '../config/calendar-day';
import type { DatetimeFormat, PathClass } from './profile.types';

export const swaggerTypeLabel = (
  pathClass: string,
  datetimeFormat?: string,
): string => {
  if (pathClass === 'boolean') {
    return 'boolean';
  }
  if (pathClass === 'number-string') {
    return 'integer';
  }
  if (pathClass === 'datetime') {
    return datetimeFormat === 'date' ? 'date' : 'date-time';
  }
  if (pathClass === 'nested' || pathClass === 'open-map') {
    return 'object';
  }
  if (pathClass === 'array') {
    return 'array';
  }
  if (pathClass === 'rejected') {
    return 'rejected';
  }
  return 'string';
};

const labelFromValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'integer';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  if (typeof value === 'string') {
    if (ISO_DATE_TIME.test(value)) {
      return 'date-time';
    }
    if (DATE_ONLY.test(value)) {
      return 'date';
    }
    return 'string';
  }
  return undefined;
};

export const collectTypeVariants = (input: {
  values: unknown[];
  pathClass: PathClass;
  datetimeFormat?: DatetimeFormat;
  itemPathClass?: PathClass;
  itemDatetimeFormat?: DatetimeFormat;
}): string[] => {
  const nonNull = input.values.filter((value) => value !== null);
  const hasNull = input.values.some((value) => value === null);
  const labels = new Set<string>();
  if (input.pathClass === 'rejected') {
    for (const value of nonNull) {
      const label = labelFromValue(value);
      if (label) {
        labels.add(label);
      }
    }
  } else if (input.pathClass === 'array') {
    if (!input.itemPathClass) {
      labels.add('array');
    } else {
      const item = swaggerTypeLabel(
        input.itemPathClass,
        input.itemDatetimeFormat,
      );
      labels.add(`array[${item}]`);
    }
  } else {
    labels.add(swaggerTypeLabel(input.pathClass, input.datetimeFormat));
  }
  const ordered = [...labels];
  if (hasNull) {
    ordered.push('null');
  }
  return ordered;
};
