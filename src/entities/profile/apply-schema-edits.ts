import { mergeCategoryValues } from './enum-extras';
import {
  parseSchemaFieldPath,
  parseSchemaFieldSegment,
  remapSchemaPath,
} from './parse-schema-field-path';
import { computeProfileVersionId } from './profile-version-id';
import { profileLinksOf, type ProfileLinkFields } from './profile-links';
import type {
  DatetimeFormat,
  PathClass,
  PathStats,
  ProfileVersion,
} from './profile.types';

export type SchemaPathOverride = {
  path: string;
  pathClass: PathClass;
  datetimeFormat?: DatetimeFormat;
  itemPathClass?: PathClass;
  itemDatetimeFormat?: DatetimeFormat;
};

export type ApplySchemaEditsInput = {
  version: ProfileVersion;
  overrides: SchemaPathOverride[];
  enumAdded?: Record<string, string[]>;
  names?: Record<string, string>;
  links?: ProfileLinkFields;
  createdAt: string;
  minSampleSize: number;
};

export class SchemaEditConflictError extends Error {
  readonly code = 'validation_error' as const;

  constructor(message: string) {
    super(message);
    this.name = 'SchemaEditConflictError';
  }
}

const applyOverride = (
  stats: PathStats,
  override: SchemaPathOverride | undefined,
  enumAdded: string[],
): PathStats => {
  const pathClass = override?.pathClass ?? stats.pathClass;
  const datetimeFormat =
    pathClass === 'datetime'
      ? (override?.datetimeFormat ?? stats.datetimeFormat ?? 'date-time')
      : undefined;
  const categoryValues =
    pathClass === 'category'
      ? mergeCategoryValues(stats.categoryValues, enumAdded)
      : undefined;
  const itemPathClass =
    pathClass === 'array'
      ? (override?.itemPathClass ?? stats.itemPathClass ?? 'free-text')
      : undefined;
  const itemDatetimeFormat =
    itemPathClass === 'datetime'
      ? (override?.itemDatetimeFormat ??
        stats.itemDatetimeFormat ??
        'date-time')
      : undefined;
  const itemCategoryValues =
    itemPathClass === 'category'
      ? mergeCategoryValues(stats.itemCategoryValues, enumAdded)
      : undefined;
  return {
    ...stats,
    pathClass,
    datetimeFormat,
    categoryValues,
    itemPathClass,
    itemDatetimeFormat,
    itemCategoryValues,
  };
};

const sortedPaths = (paths: PathStats[]): PathStats[] =>
  [...paths].sort((left, right) => left.path.localeCompare(right.path));

const blankRates = {
  presenceRate: 1,
  nullRate: 0,
  emptyStringRate: 0,
  emptyArrayRate: 0,
  emptyObjectRate: 0,
  missingKeyRate: 0,
};

export const createAddedPathStats = (
  path: string,
  pathClass: PathClass,
  datetimeFormat: DatetimeFormat | undefined,
  enumAdded: string[],
  itemPathClass?: PathClass,
  itemDatetimeFormat?: DatetimeFormat,
): PathStats => {
  const categoryValues =
    pathClass === 'category'
      ? mergeCategoryValues(undefined, enumAdded)
      : undefined;
  const nextItemClass =
    pathClass === 'array' ? (itemPathClass ?? 'free-text') : undefined;
  const itemCategoryValues =
    nextItemClass === 'category'
      ? mergeCategoryValues(undefined, enumAdded)
      : undefined;
  return {
    path,
    pathClass,
    ...blankRates,
    cardinality: categoryValues?.length || itemCategoryValues?.length || 1,
    categoryValues,
    datetimeFormat:
      pathClass === 'datetime' ? (datetimeFormat ?? 'date-time') : undefined,
    itemPathClass: nextItemClass,
    itemDatetimeFormat:
      nextItemClass === 'datetime'
        ? (itemDatetimeFormat ?? 'date-time')
        : undefined,
    itemCategoryValues,
  };
};

const parentPath = (path: string): string | null => {
  const index = path.lastIndexOf('.');
  return index === -1 ? null : path.slice(0, index);
};

const ensureParents = (paths: PathStats[], childPath: string): void => {
  const seen = new Set(paths.map((item) => item.path));
  let current = parentPath(childPath);
  const missing: string[] = [];
  while (current && !seen.has(current)) {
    missing.push(current);
    current = parentPath(current);
  }
  missing.reverse().forEach((path) => {
    if (seen.has(path)) {
      return;
    }
    paths.push(createAddedPathStats(path, 'nested', undefined, []));
    seen.add(path);
  });
};

const assertUniquePaths = (paths: PathStats[]): void => {
  const seen = new Set<string>();
  paths.forEach((item) => {
    if (seen.has(item.path)) {
      throw new SchemaEditConflictError('Имена полей пересекаются');
    }
    seen.add(item.path);
  });
};

const assertNames = (names: Record<string, string>): void => {
  Object.values(names).forEach((value) => {
    if (!value.trim()) {
      return;
    }
    if (!parseSchemaFieldSegment(value)) {
      throw new SchemaEditConflictError('Некорректное имя поля');
    }
  });
};

export const applySchemaEdits = (
  input: ApplySchemaEditsInput,
): ProfileVersion => {
  const names = input.names ?? {};
  assertNames(names);
  const overrideByPath = new Map(
    input.overrides.map((item) => [item.path, item]),
  );
  const existingKeys = new Set(input.version.paths.map((item) => item.path));
  const remapped = input.version.paths.map((stats) => {
    const next = applyOverride(
      stats,
      overrideByPath.get(stats.path),
      input.enumAdded?.[stats.path] ?? [],
    );
    return { ...next, path: remapSchemaPath(stats.path, names) };
  });
  const added = input.overrides
    .filter((item) => !existingKeys.has(item.path))
    .map((item) => {
      const path = parseSchemaFieldPath(item.path);
      if (!path) {
        throw new SchemaEditConflictError('Некорректное имя поля');
      }
      return createAddedPathStats(
        path,
        item.pathClass,
        item.datetimeFormat,
        input.enumAdded?.[item.path] ?? [],
        item.itemPathClass,
        item.itemDatetimeFormat,
      );
    });
  added.forEach((item) => {
    ensureParents(remapped, item.path);
  });
  const paths = sortedPaths([...remapped, ...added]);
  assertUniquePaths(paths);
  const aliases = [
    ...input.version.aliases,
    ...input.version.paths
      .map((stats) => ({
        from: stats.path,
        to: remapSchemaPath(stats.path, names),
      }))
      .filter((item) => item.from !== item.to),
  ];
  const rejectedCount = paths.filter(
    (item) => item.pathClass === 'rejected',
  ).length;
  const remap = (path: string): string => remapSchemaPath(path, names);
  const sourceLinks = input.links ?? profileLinksOf(input.version);
  const links: ProfileLinkFields = {
    identifierPaths: sourceLinks.identifierPaths.map(remap),
    dateShiftPaths: sourceLinks.dateShiftPaths.map(remap),
    dateOrderInvariants: sourceLinks.dateOrderInvariants.map((item) => ({
      earlierPath: remap(item.earlierPath),
      laterPath: remap(item.laterPath),
    })),
    parentChildInvariants: sourceLinks.parentChildInvariants.map((item) => ({
      parentPath: remap(item.parentPath),
      childPath: item.childPath,
      arrayPath: remap(item.arrayPath),
    })),
    valueEqualities: sourceLinks.valueEqualities.map((item) => ({
      ...item,
      arrayPath: item.arrayPath ? remap(item.arrayPath) : undefined,
      paths: item.paths.map(remap),
    })),
    crossTypeLinks: sourceLinks.crossTypeLinks.map((item) => ({
      ...item,
      localPath: remap(item.localPath),
    })),
  };
  return {
    ...input.version,
    ...links,
    versionId: computeProfileVersionId({
      documentType: input.version.documentType,
      contour: input.version.contour,
      snapshotId: input.version.snapshotId,
      paths,
      aliases,
      ...links,
    }),
    createdAt: input.createdAt,
    paths,
    aliases,
    activatable:
      rejectedCount === 0 &&
      input.version.sampleDocumentCount >= input.minSampleSize,
  };
};

export const schemaEditContentId = (
  version: Pick<
    ProfileVersion,
    | 'documentType'
    | 'contour'
    | 'snapshotId'
    | 'paths'
    | 'aliases'
    | 'identifierPaths'
    | 'dateShiftPaths'
    | 'dateOrderInvariants'
    | 'parentChildInvariants'
    | 'valueEqualities'
    | 'crossTypeLinks'
  >,
): string =>
  computeProfileVersionId({
    ...version,
    ...profileLinksOf(version),
    paths: sortedPaths(version.paths),
  });
