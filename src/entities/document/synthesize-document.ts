import { createHash } from 'crypto';
import {
  existingLocalDateTime,
  localCalendarDay,
} from '../config/calendar-day';
import type { FieldConstraint } from '../job/field-constraint';
import type { PathStats, ProfileVersion } from '../profile/profile.types';
import { getByPath, hasPathKey, setByPath } from '../profile/path-value';
import { profileLinksOf } from '../profile/profile-links';
import { assertDocumentInvariants } from './assert-document-invariants';
import {
  deriveDocumentId,
  deriveItemId,
  deriveLocalId,
  isDocumentIdForJob,
} from './document-ids';

export type SynthesizeInput = {
  version: ProfileVersion;
  seed: string;
  jobId: string;
  number: number;
  generatedAt: string;
  zone: string;
  linkedDocumentId?: string;
  allowedLinkedIds?: string[];
  constraints?: FieldConstraint[];
  expandArrayPaths?: string[];
};

export class LinkOutsideJobError extends Error {
  constructor() {
    super('link_outside_job');
  }
}

export class CorpusValueLeakError extends Error {
  constructor() {
    super('corpus_value_leak');
  }
}

export { deriveDocumentId, deriveLocalId, deriveItemId } from './document-ids';

const pickIndex = (
  path: string,
  seed: string,
  number: number,
  size: number,
): number => {
  const hash = createHash('sha256')
    .update(`${seed}:${path}:${number}`)
    .digest('hex');
  return parseInt(hash.slice(0, 8), 16) % size;
};

const hash01 = (seed: string, key: string, number: number): number =>
  parseInt(
    createHash('sha256')
      .update(`${seed}:${key}:${number}:p`)
      .digest('hex')
      .slice(0, 8),
    16,
  ) / 0x100000000;

const pickCategory = (
  path: string,
  seed: string,
  number: number,
  values: string[],
): string => {
  if (values.length === 0) {
    return 'NEW';
  }
  return (
    values[pickIndex(path, seed, number, values.length)] ?? values[0] ?? 'NEW'
  );
};

const pickBoolean = (
  path: string,
  seed: string,
  number: number,
  values: boolean[],
): boolean => {
  if (values.length === 0) {
    return false;
  }
  return (
    values[pickIndex(path, seed, number, values.length)] ?? values[0] ?? false
  );
};

const syntheticFreeText = (
  path: string,
  seed: string,
  number: number,
  maxLen: number,
): string => {
  const hash = createHash('sha256')
    .update(`${seed}:${path}:${number}:text`)
    .digest('hex');
  return `syn-${path}-${hash}`.slice(0, maxLen);
};

const syntheticNumber = (
  path: string,
  seed: string,
  number: number,
): number => {
  const hash = createHash('sha256')
    .update(`${seed}:${path}:${number}:num`)
    .digest('hex');
  return parseInt(hash.slice(0, 6), 16) % 10000;
};

const constraintFor = (
  constraints: FieldConstraint[] | undefined,
  path: string,
): FieldConstraint | undefined =>
  constraints?.find((item) => item.path === path);

const classRank = (stats: PathStats): number => {
  if (stats.path === 'id' || stats.pathClass === 'identifier') {
    return 0;
  }
  if (stats.pathClass === 'nested' || stats.pathClass === 'array') {
    return 1;
  }
  if (stats.pathClass === 'category') {
    return 2;
  }
  if (
    stats.pathClass === 'datetime' ||
    stats.pathClass === 'boolean' ||
    stats.pathClass === 'number-string'
  ) {
    return 3;
  }
  if (stats.pathClass === 'free-text') {
    return 5;
  }
  return 4;
};

const orderedPaths = (paths: PathStats[]): PathStats[] =>
  [...paths].sort((left, right) => {
    const depth = left.path.split('.').length - right.path.split('.').length;
    if (depth !== 0) {
      return depth;
    }
    const rank = classRank(left) - classRank(right);
    if (rank !== 0) {
      return rank;
    }
    return left.path.localeCompare(right.path);
  });

const parentPath = (path: string): string | null => {
  const index = path.lastIndexOf('.');
  return index === -1 ? null : path.slice(0, index);
};

type Presence = 'omit' | 'null' | 'value';

const pickPresence = (
  seed: string,
  key: string,
  number: number,
  missingRate: number,
  nullRate: number,
  locked: boolean,
): Presence => {
  if (locked) {
    return 'value';
  }
  const unit = hash01(seed, key, number);
  if (unit < missingRate) {
    return 'omit';
  }
  const rest = (unit - missingRate) / Math.max(1 - missingRate, 1e-9);
  if (rest < nullRate) {
    return 'null';
  }
  return 'value';
};

const dateValue = (
  stats: PathStats | undefined,
  generatedAt: string,
  zone: string,
): string => {
  const safe = existingLocalDateTime(generatedAt, zone);
  if (stats?.datetimeFormat === 'date') {
    return localCalendarDay(safe, zone);
  }
  return safe;
};

const isDatetimePath = (
  byPath: Map<string, PathStats>,
  path: string,
): boolean => {
  const stats = byPath.get(path);
  return stats?.pathClass === 'datetime' || path === 'creationDateTime';
};

const equalityValue = (
  input: SynthesizeInput,
  paths: string[],
  scope: 'document' | 'array-item',
  arrayPath: string | undefined,
  documentId: string,
  parentChildFull: Set<string>,
  byPath: Map<string, PathStats>,
): unknown => {
  if (paths.length > 0 && paths.every((path) => isDatetimePath(byPath, path))) {
    return dateValue(byPath.get(paths[0] ?? ''), input.generatedAt, input.zone);
  }
  if (paths.includes('id') || paths.some((path) => parentChildFull.has(path))) {
    return documentId;
  }
  if (scope === 'array-item' && arrayPath) {
    return deriveItemId(
      input.jobId,
      input.number,
      `${arrayPath}:${paths.join('|')}`,
      0,
    );
  }
  return deriveLocalId(input.jobId, input.number, paths[0] ?? 'id', 0);
};

export const synthesizeDocument = (
  input: SynthesizeInput,
): Record<string, unknown> => {
  if (input.linkedDocumentId) {
    const allowed = input.allowedLinkedIds;
    const inAllowed = allowed
      ? allowed.includes(input.linkedDocumentId)
      : isDocumentIdForJob(input.jobId, input.linkedDocumentId);
    if (!inAllowed) {
      throw new LinkOutsideJobError();
    }
  }
  const links = profileLinksOf(input.version);
  const byPath = new Map(input.version.paths.map((item) => [item.path, item]));
  const childPathsOf = (path: string): boolean =>
    input.version.paths.some((item) => item.path.startsWith(`${path}.`));
  const id = deriveDocumentId(input.jobId, input.number);
  const generatedAt = existingLocalDateTime(input.generatedAt, input.zone);
  const assigned = new Map<string, unknown>();
  if (byPath.has('id')) {
    assigned.set('id', id);
  }
  if (byPath.has('creationDateTime')) {
    assigned.set('creationDateTime', generatedAt);
  }
  const parentChildFull = new Set(
    links.parentChildInvariants.map(
      (item) => `${item.arrayPath}.${item.childPath}`,
    ),
  );
  for (const rule of links.parentChildInvariants) {
    assigned.set(`${rule.arrayPath}.${rule.childPath}`, id);
  }
  for (const group of links.valueEqualities) {
    const value = equalityValue(
      input,
      group.paths,
      group.scope,
      group.arrayPath,
      id,
      parentChildFull,
      byPath,
    );
    for (const path of group.paths) {
      if (!assigned.has(path)) {
        assigned.set(path, value);
      }
    }
  }
  for (const path of links.dateShiftPaths) {
    assigned.set(path, dateValue(byPath.get(path), generatedAt, input.zone));
  }
  const body: Record<string, unknown> = {};
  const omitted = new Set<string>();
  const groupKey = (path: string): string => {
    const equality = links.valueEqualities.find((group) =>
      group.paths.includes(path),
    );
    if (equality) {
      return `eq:${equality.paths.join('|')}`;
    }
    const parent = links.parentChildInvariants.find(
      (item) => `${item.arrayPath}.${item.childPath}` === path,
    );
    if (parent) {
      return `pc:${parent.arrayPath}`;
    }
    return path;
  };
  const presenceOf = (stats: PathStats): Presence => {
    const locked =
      stats.path === 'id' ||
      Boolean(constraintFor(input.constraints, stats.path)) ||
      (stats.missingKeyRate < 1 && stats.nullRate < 1);
    return pickPresence(
      input.seed,
      groupKey(stats.path),
      input.number,
      stats.missingKeyRate,
      stats.nullRate,
      locked,
    );
  };
  const parentBlocksChildren = (parent: string): boolean => {
    if (omitted.has(parent) || !hasPathKey(body, parent)) {
      return true;
    }
    const value = getByPath(body, parent);
    if (value === null) {
      return true;
    }
    return Array.isArray(value) && value.length === 0;
  };
  for (const stats of orderedPaths(input.version.paths)) {
    if (stats.pathClass === 'rejected') {
      continue;
    }
    const parent = parentPath(stats.path);
    if (parent && parentBlocksChildren(parent)) {
      omitted.add(stats.path);
      continue;
    }
    const presence = presenceOf(stats);
    if (presence === 'omit') {
      omitted.add(stats.path);
      continue;
    }
    if (presence === 'null') {
      setByPath(body, stats.path, null);
      continue;
    }
    const constraint = constraintFor(input.constraints, stats.path);
    if (assigned.has(stats.path)) {
      setByPath(body, stats.path, assigned.get(stats.path));
      continue;
    }
    if (stats.pathClass === 'identifier') {
      setByPath(
        body,
        stats.path,
        deriveLocalId(input.jobId, input.number, stats.path, 0),
      );
      continue;
    }
    if (stats.path === 'status' || stats.pathClass === 'category') {
      const values =
        constraint?.kind === 'category' && constraint.values.length
          ? constraint.values
          : stats.categoryValues?.length
            ? stats.categoryValues
            : stats.path === 'status'
              ? ['NEW', 'PENDING', 'ERROR', 'DONE']
              : stats.path === 'messageType'
                ? ['type-a', 'type-b']
                : ['value'];
      setByPath(
        body,
        stats.path,
        pickCategory(stats.path, input.seed, input.number, values),
      );
      continue;
    }
    if (stats.pathClass === 'boolean') {
      const values =
        constraint?.kind === 'boolean' && constraint.values.length
          ? constraint.values
          : [true, false];
      setByPath(
        body,
        stats.path,
        pickBoolean(stats.path, input.seed, input.number, values),
      );
      continue;
    }
    if (stats.pathClass === 'number-string') {
      setByPath(
        body,
        stats.path,
        syntheticNumber(stats.path, input.seed, input.number),
      );
      continue;
    }
    if (stats.pathClass === 'datetime' || stats.path === 'creationDateTime') {
      if (constraint?.kind === 'datetime' && constraint.values.length) {
        setByPath(
          body,
          stats.path,
          pickCategory(stats.path, input.seed, input.number, constraint.values),
        );
      } else {
        setByPath(body, stats.path, dateValue(stats, generatedAt, input.zone));
      }
      continue;
    }
    if (stats.pathClass === 'nested') {
      setByPath(body, stats.path, {});
      continue;
    }
    if (stats.pathClass === 'array') {
      const expand = Boolean(input.expandArrayPaths?.includes(stats.path));
      const emptyArray =
        !expand &&
        (stats.emptyArrayRate >= 1 ||
          (stats.emptyArrayRate > 0 &&
            hash01(input.seed, `${stats.path}:empty-array`, input.number) <
              stats.emptyArrayRate));
      if (emptyArray) {
        setByPath(body, stats.path, []);
        continue;
      }
      const itemClass = stats.itemPathClass;
      const nestedItems = itemClass === 'nested' || childPathsOf(stats.path);
      if (nestedItems) {
        setByPath(body, stats.path, [{}]);
      } else if (itemClass === 'category') {
        const values = stats.itemCategoryValues?.length
          ? stats.itemCategoryValues
          : ['value'];
        setByPath(body, stats.path, [
          pickCategory(stats.path, input.seed, input.number, values),
        ]);
      } else if (itemClass === 'boolean') {
        setByPath(body, stats.path, [
          pickBoolean(stats.path, input.seed, input.number, [true, false]),
        ]);
      } else if (itemClass === 'number-string') {
        setByPath(body, stats.path, [
          syntheticNumber(stats.path, input.seed, input.number),
        ]);
      } else if (itemClass === 'datetime') {
        if (stats.itemDatetimeFormat === 'date') {
          setByPath(body, stats.path, [
            localCalendarDay(generatedAt, input.zone),
          ]);
        } else {
          setByPath(body, stats.path, [generatedAt]);
        }
      } else if (itemClass === 'identifier') {
        setByPath(body, stats.path, [
          deriveLocalId(input.jobId, input.number, stats.path, 0),
        ]);
      } else if (itemClass === 'free-text') {
        setByPath(body, stats.path, [
          syntheticFreeText(stats.path, input.seed, input.number, 120),
        ]);
      } else {
        setByPath(body, stats.path, []);
      }
      continue;
    }
    if (stats.pathClass === 'free-text') {
      setByPath(
        body,
        stats.path,
        syntheticFreeText(stats.path, input.seed, input.number, 120),
      );
    }
  }
  if (!hasPathKey(body, 'id') && byPath.has('id')) {
    body.id = id;
  }
  assertNoCorpusLeak(body, input.version);
  assertDocumentInvariants({
    body,
    version: input.version,
    generatedAt,
    zone: input.zone,
  });
  return body;
};

const assertNoCorpusLeak = (
  body: Record<string, unknown>,
  version: SynthesizeInput['version'],
): void => {
  for (const stats of version.paths) {
    if (stats.pathClass !== 'free-text') {
      continue;
    }
    const value = getByPath(body, stats.path);
    if (typeof value !== 'string') {
      continue;
    }
    for (const fingerprint of version.corpusValueFingerprints) {
      if (fingerprint.length >= 8 && value.includes(fingerprint)) {
        throw new CorpusValueLeakError();
      }
    }
  }
};
