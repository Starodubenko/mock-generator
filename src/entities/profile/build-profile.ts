import { DATE_ONLY, ISO_DATE_TIME } from '../config/calendar-day';
import type {
  DatetimeFormat,
  PathClass,
  PathStats,
  ProfileVersion,
} from './profile.types';
import { applyMapping, type MappingView } from './apply-mapping';
import { corpusSampleCount } from './parse-corpus-files';
import { collectPathValues, hasPathKey } from './path-value';
import { computeProfileVersionId } from './profile-version-id';
import { attachLinkInvariants } from './discover-link-invariants';
import { collectTypeVariants } from './type-variants';

const DEFAULT_MAX_CATEGORY_CARDINALITY = 32;

const inferDatetimeFormat = (
  values: unknown[],
): DatetimeFormat | 'mixed' | undefined => {
  const strings = values.filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
  if (strings.length === 0) {
    return undefined;
  }
  const dateTimeCount = strings.filter((value) =>
    ISO_DATE_TIME.test(value),
  ).length;
  const dateCount = strings.filter((value) => DATE_ONLY.test(value)).length;
  if (dateTimeCount > 0 && dateCount > 0) {
    return 'mixed';
  }
  if (dateTimeCount === strings.length) {
    return 'date-time';
  }
  if (dateCount === strings.length) {
    return 'date';
  }
  return undefined;
};

const inferPathClass = (
  path: string,
  values: unknown[],
  maxCategoryCardinality: number,
): PathClass => {
  const present = values.filter((value) => value !== undefined);
  const types = new Set(
    present.map((value) => (value === null ? 'null' : typeof value)),
  );
  if (types.has('null')) {
    types.delete('null');
  }
  if (types.size > 1) {
    return 'rejected';
  }
  if (path === 'id' || path.endsWith('Id') || path.endsWith('ID')) {
    return 'identifier';
  }
  const sample = present.find((value) => value !== null);
  if (typeof sample === 'boolean') {
    return 'boolean';
  }
  if (typeof sample === 'number') {
    return 'number-string';
  }
  if (Array.isArray(sample)) {
    return 'array';
  }
  if (typeof sample === 'object') {
    return 'nested';
  }
  if (typeof sample === 'string') {
    const datetimeFormat = inferDatetimeFormat(present);
    if (datetimeFormat === 'mixed') {
      return 'rejected';
    }
    if (datetimeFormat) {
      return 'datetime';
    }
    const unique = new Set(
      present.filter((value): value is string => typeof value === 'string'),
    );
    if (unique.size <= maxCategoryCardinality) {
      return 'category';
    }
    return 'free-text';
  }
  return 'free-text';
};

const collectPathNames = (
  value: unknown,
  prefix: string,
  names: Set<string>,
): void => {
  if (value === null || value === undefined || typeof value !== 'object') {
    if (prefix) {
      names.add(prefix);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (prefix) {
      names.add(prefix);
    }
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        collectPathNames(item, prefix, names);
      }
    }
    return;
  }
  const record = value as Record<string, unknown>;
  if (
    prefix.endsWith('additionalProperties') ||
    (prefix === '' && 'additionalProperties' in record)
  ) {
    if (prefix) {
      names.add(prefix);
    }
    return;
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === 'additionalProperties') {
      continue;
    }
    if (/^[a-f0-9-]{8,}$/i.test(key)) {
      continue;
    }
    const childPath = prefix ? `${prefix}.${key}` : key;
    names.add(childPath);
    if (child !== null && typeof child === 'object') {
      collectPathNames(child, childPath, names);
    }
  }
};

const flattenArrayItems = (values: unknown[]): unknown[] => {
  const items: unknown[] = [];
  for (const value of values) {
    if (!Array.isArray(value)) {
      continue;
    }
    for (const item of value) {
      items.push(item);
    }
  }
  return items;
};

const inferArrayItem = (
  path: string,
  values: unknown[],
  maxCategoryCardinality: number,
): Pick<
  PathStats,
  'itemPathClass' | 'itemDatetimeFormat' | 'itemCategoryValues'
> => {
  const items = flattenArrayItems(values);
  if (items.length === 0) {
    return {};
  }
  const itemPathClass = inferPathClass(path, items, maxCategoryCardinality);
  const itemCategoryValues =
    itemPathClass === 'category'
      ? [
          ...new Set(
            items.filter((item): item is string => typeof item === 'string'),
          ),
        ]
      : undefined;
  const datetimeKind =
    itemPathClass === 'datetime' ? inferDatetimeFormat(items) : undefined;
  const itemDatetimeFormat =
    datetimeKind === 'date' || datetimeKind === 'date-time'
      ? datetimeKind
      : undefined;
  return { itemPathClass, itemDatetimeFormat, itemCategoryValues };
};

const fingerprintValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.slice(0, 64);
  }
  return JSON.stringify(value).slice(0, 64);
};

const applyAliases = (
  document: Record<string, unknown>,
  aliases: Array<{ from: string; to: string }>,
): Record<string, unknown> => {
  const next = { ...document };
  for (const alias of aliases) {
    if (alias.from in next && !(alias.to in next)) {
      next[alias.to] = next[alias.from];
      delete next[alias.from];
    }
  }
  return next;
};

export type BuildProfileInput = {
  documentType: string;
  contour: string;
  snapshotId: string;
  mappingIndex: string;
  aliases: Array<{ from: string; to: string }>;
  documents: Record<string, unknown>[];
  minSampleSize: number;
  createdAt: string;
  maxCategoryCardinality?: number;
  mapping?: MappingView;
};

export type BuildProfileResult =
  | {
      ok: true;
      version: ProfileVersion;
      activatable: boolean;
      reportReason: string | null;
    }
  | {
      ok: false;
      reason: 'empty_corpus' | 'mixed_types' | 'source_is_synthetic';
    };

export const buildProfile = (input: BuildProfileInput): BuildProfileResult => {
  if (input.documents.length === 0) {
    return { ok: false, reason: 'empty_corpus' };
  }
  const documents = input.documents.map((document) =>
    applyAliases(document, input.aliases),
  );
  const names = new Set<string>();
  for (const document of documents) {
    collectPathNames(document, '', names);
  }
  const maxCategoryCardinality =
    input.maxCategoryCardinality ?? DEFAULT_MAX_CATEGORY_CARDINALITY;
  const paths: PathStats[] = [];
  for (const path of names) {
    const values: unknown[] = [];
    let missing = 0;
    let present = 0;
    for (const document of documents) {
      if (!hasPathKey(document, path)) {
        missing += 1;
        continue;
      }
      present += 1;
      const collected = collectPathValues(document, path);
      if (collected.length === 0) {
        values.push(undefined);
      } else {
        values.push(...collected);
      }
    }
    const pathClass = inferPathClass(path, values, maxCategoryCardinality);
    const categoryValues =
      pathClass === 'category'
        ? [
            ...new Set(
              values.filter(
                (value): value is string => typeof value === 'string',
              ),
            ),
          ]
        : undefined;
    const datetimeKind =
      pathClass === 'datetime' ? inferDatetimeFormat(values) : undefined;
    const datetimeFormat =
      datetimeKind === 'date' || datetimeKind === 'date-time'
        ? datetimeKind
        : undefined;
    const arrayItem =
      pathClass === 'array'
        ? inferArrayItem(path, values, maxCategoryCardinality)
        : {};
    const denominator = values.length || 1;
    const typeVariants = collectTypeVariants({
      values,
      pathClass,
      datetimeFormat,
      itemPathClass: arrayItem.itemPathClass,
      itemDatetimeFormat: arrayItem.itemDatetimeFormat,
    });
    paths.push({
      path,
      pathClass,
      presenceRate: present / documents.length,
      missingKeyRate: missing / documents.length,
      nullRate: values.filter((value) => value === null).length / denominator,
      emptyStringRate:
        values.filter((value) => value === '').length / denominator,
      emptyArrayRate:
        values.filter((value) => Array.isArray(value) && value.length === 0)
          .length / denominator,
      emptyObjectRate:
        values.filter(
          (value) =>
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0,
        ).length / denominator,
      cardinality: new Set(values.map((value) => JSON.stringify(value))).size,
      categoryValues,
      datetimeFormat,
      typeVariants,
      ...arrayItem,
    });
  }
  for (const stats of paths) {
    if (stats.pathClass !== 'array') {
      continue;
    }
    if (paths.some((item) => item.path.startsWith(`${stats.path}.`))) {
      stats.itemPathClass = 'nested';
    }
  }
  paths.sort((left, right) => left.path.localeCompare(right.path));
  const fingerprints = new Set<string>();
  for (const stats of paths) {
    if (stats.pathClass !== 'free-text' && stats.pathClass !== 'identifier') {
      continue;
    }
    for (const document of documents) {
      for (const value of collectPathValues(document, stats.path)) {
        const fingerprint = fingerprintValue(value);
        if (fingerprint.length >= 8) {
          fingerprints.add(fingerprint);
        }
      }
    }
  }
  const versionId = computeProfileVersionId({
    documentType: input.documentType,
    contour: input.contour,
    snapshotId: input.snapshotId,
    paths,
    aliases: input.aliases,
  });
  const rejectedCount = paths.filter(
    (item) => item.pathClass === 'rejected',
  ).length;
  const sampleDocumentCount = corpusSampleCount(documents);
  const activatable =
    rejectedCount === 0 && sampleDocumentCount >= input.minSampleSize;
  let version: ProfileVersion = {
    versionId,
    documentType: input.documentType,
    contour: input.contour,
    snapshotId: input.snapshotId,
    createdAt: input.createdAt,
    paths,
    mappingIndex: input.mappingIndex,
    aliases: input.aliases,
    corpusValueFingerprints: fingerprints,
    sampleDocumentCount,
    activatable,
  };
  version = attachLinkInvariants(version, documents);
  version = {
    ...version,
    versionId: computeProfileVersionId({
      documentType: version.documentType,
      contour: version.contour,
      snapshotId: version.snapshotId,
      paths: version.paths,
      aliases: version.aliases,
      identifierPaths: version.identifierPaths,
      dateShiftPaths: version.dateShiftPaths,
      dateOrderInvariants: version.dateOrderInvariants,
      parentChildInvariants: version.parentChildInvariants,
      valueEqualities: version.valueEqualities,
      crossTypeLinks: version.crossTypeLinks,
    }),
  };
  if (input.mapping) {
    version = applyMapping(version, input.mapping);
  }
  return {
    ok: true,
    version,
    activatable: version.activatable,
    reportReason: version.activatable
      ? null
      : rejectedCount > 0
        ? 'type_conflict'
        : 'below_min_sample',
  };
};
