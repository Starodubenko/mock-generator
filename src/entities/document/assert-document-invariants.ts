import {
  DATE_ONLY,
  ISO_DATE_TIME,
  localCalendarDay,
} from '../config/calendar-day';
import { getByPath, hasPathKey } from '../profile/path-value';
import { profileLinksOf } from '../profile/profile-links';
import type { ProfileVersion } from '../profile/profile.types';
export class InvariantExhaustedError extends Error {
  constructor() {
    super('invariant_exhausted');
  }
}

const parentPath = (path: string): string | null => {
  const index = path.lastIndexOf('.');
  return index === -1 ? null : path.slice(0, index);
};

const toMillis = (value: string): number => {
  if (DATE_ONLY.test(value)) {
    return Date.parse(`${value}T00:00:00Z`);
  }
  return Date.parse(value);
};

export const assertDocumentInvariants = (input: {
  body: Record<string, unknown>;
  version: ProfileVersion;
  generatedAt: string;
  zone: string;
}): void => {
  const links = profileLinksOf(input.version);
  for (const stats of input.version.paths) {
    if (stats.pathClass === 'rejected' && hasPathKey(input.body, stats.path)) {
      throw new InvariantExhaustedError();
    }
    const parent = parentPath(stats.path);
    if (parent && hasPathKey(input.body, stats.path) && !hasPathKey(input.body, parent)) {
      throw new InvariantExhaustedError();
    }
    const value = getByPath(input.body, stats.path);
    if (value === null && stats.nullRate === 0) {
      throw new InvariantExhaustedError();
    }
  }
  for (const rule of links.dateOrderInvariants) {
    const earlier = getByPath(input.body, rule.earlierPath);
    const later = getByPath(input.body, rule.laterPath);
    if (typeof earlier !== 'string' || typeof later !== 'string') {
      continue;
    }
    if (toMillis(earlier) > toMillis(later)) {
      throw new InvariantExhaustedError();
    }
  }
  const creation = getByPath(input.body, 'creationDateTime');
  if (typeof creation === 'string' && ISO_DATE_TIME.test(creation)) {
    if (localCalendarDay(creation, input.zone) !== localCalendarDay(input.generatedAt, input.zone)) {
      throw new InvariantExhaustedError();
    }
  }
  for (const rule of links.parentChildInvariants) {
    const parent = getByPath(input.body, rule.parentPath);
    const child = getByPath(input.body, `${rule.arrayPath}.${rule.childPath}`);
    if (parent == null || child == null) {
      continue;
    }
    if (parent !== child) {
      throw new InvariantExhaustedError();
    }
  }
  for (const group of links.valueEqualities) {
    const values = group.paths
      .map((path) => getByPath(input.body, path))
      .filter((value) => value !== null && value !== undefined);
    if (values.length <= 1) {
      continue;
    }
    if (values.some((value) => value !== values[0])) {
      throw new InvariantExhaustedError();
    }
  }
};
