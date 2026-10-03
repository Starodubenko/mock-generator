import {
  DATE_ONLY,
  ISO_DATE_TIME,
  localCalendarDay,
} from '../config/calendar-day';
import type { ProfileVersion } from '../profile/profile.types';
import type { FieldConstraint } from './field-constraint';
import { normalizeFieldConstraints } from './field-constraint';

export type ConstraintValidation =
  | { ok: true; constraints: FieldConstraint[] }
  | { ok: false; reason: 'validation_error' };

const toBooleans = (values: unknown[]): boolean[] | null => {
  const result: boolean[] = [];
  for (const value of values) {
    if (value === true || value === 'true') {
      result.push(true);
    } else if (value === false || value === 'false') {
      result.push(false);
    } else {
      return null;
    }
  }
  return [...new Set(result)];
};

export const validateFieldConstraints = (
  constraints: FieldConstraint[] | undefined,
  version: ProfileVersion,
  generatedAt: string,
  zone: string,
): ConstraintValidation => {
  const normalized = normalizeFieldConstraints(constraints);
  if (normalized.length === 0) {
    return { ok: true, constraints: [] };
  }
  const byPath = new Map(version.paths.map((item) => [item.path, item]));
  const goldenDay = localCalendarDay(generatedAt, zone);
  for (const item of normalized) {
    const stats = byPath.get(item.path);
    if (!stats || stats.pathClass !== item.kind) {
      return { ok: false, reason: 'validation_error' };
    }
    if (item.values.length === 0) {
      return { ok: false, reason: 'validation_error' };
    }
    if (item.kind === 'boolean') {
      const booleans = toBooleans(item.values);
      if (!booleans) {
        return { ok: false, reason: 'validation_error' };
      }
      continue;
    }
    if (item.kind === 'category') {
      const allowed = new Set(stats.categoryValues ?? []);
      if (item.values.some((value) => !allowed.has(value))) {
        return { ok: false, reason: 'validation_error' };
      }
      continue;
    }
    for (const value of item.values) {
      const format = stats.datetimeFormat;
      if (format === 'date') {
        if (!DATE_ONLY.test(value) || value !== goldenDay) {
          return { ok: false, reason: 'validation_error' };
        }
        continue;
      }
      if (
        !ISO_DATE_TIME.test(value) ||
        localCalendarDay(value, zone) !== goldenDay
      ) {
        return { ok: false, reason: 'validation_error' };
      }
    }
  }
  const coerced = normalized.map((item) => {
    if (item.kind !== 'boolean') {
      return item;
    }
    return { ...item, values: toBooleans(item.values) ?? item.values };
  });
  return { ok: true, constraints: coerced };
};
