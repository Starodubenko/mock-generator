import { getByPath } from './path-value';
import type { PathStats, ProfileVersion } from './profile.types';
import {
  emptyProfileLinks,
  type ProfileLinkFields,
} from './profile-links';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const arrayItems = (
  document: Record<string, unknown>,
  arrayPath: string,
): Record<string, unknown>[] => {
  const value = getByPath(document, arrayPath);
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isPlainObject);
};

const isIdLike = (stats: PathStats): boolean => {
  if (
    stats.pathClass === 'datetime' ||
    stats.pathClass === 'nested' ||
    stats.pathClass === 'array' ||
    stats.pathClass === 'boolean' ||
    stats.pathClass === 'number-string'
  ) {
    return false;
  }
  return (
    stats.pathClass === 'identifier' ||
    stats.path === 'id' ||
    stats.path.endsWith('.id')
  );
};

const isDateLike = (stats: PathStats): boolean =>
  stats.pathClass === 'datetime' || stats.path === 'creationDateTime';

const pairAlwaysEqual = (
  documents: Record<string, unknown>[],
  leftPath: string,
  rightPath: string,
): boolean => {
  let seen = 0;
  for (const document of documents) {
    const left = asNonEmptyString(getByPath(document, leftPath));
    const right = asNonEmptyString(getByPath(document, rightPath));
    if (!left || !right) {
      continue;
    }
    seen += 1;
    if (left !== right) {
      return false;
    }
  }
  return seen > 0;
};

const itemPairAlwaysEqual = (
  documents: Record<string, unknown>[],
  arrayPath: string,
  leftRel: string,
  rightRel: string,
): boolean => {
  let seen = 0;
  for (const document of documents) {
    for (const item of arrayItems(document, arrayPath)) {
      const left = asNonEmptyString(getByPath(item, leftRel));
      const right = asNonEmptyString(getByPath(item, rightRel));
      if (!left || !right) {
        continue;
      }
      seen += 1;
      if (left !== right) {
        return false;
      }
    }
  }
  return seen > 0;
};

const childAlwaysEqualsParent = (
  documents: Record<string, unknown>[],
  parentPath: string,
  arrayPath: string,
  childRel: string,
): boolean => {
  let seen = 0;
  for (const document of documents) {
    const parent = asNonEmptyString(getByPath(document, parentPath));
    if (!parent) {
      continue;
    }
    for (const item of arrayItems(document, arrayPath)) {
      const child = asNonEmptyString(getByPath(item, childRel));
      if (!child) {
        continue;
      }
      seen += 1;
      if (child !== parent) {
        return false;
      }
    }
  }
  return seen > 0;
};

const groupsFromPairs = (paths: string[], equal: (a: string, b: string) => boolean): string[][] => {
  const parent = new Map(paths.map((path) => [path, path]));
  const find = (path: string): string => {
    const current = parent.get(path) ?? path;
    if (current !== path) {
      const root = find(current);
      parent.set(path, root);
      return root;
    }
    return path;
  };
  const unite = (left: string, right: string): void => {
    const a = find(left);
    const b = find(right);
    if (a !== b) {
      parent.set(b, a);
    }
  };
  for (let i = 0; i < paths.length; i += 1) {
    for (let j = i + 1; j < paths.length; j += 1) {
      const left = paths[i];
      const right = paths[j];
      if (left && right && equal(left, right)) {
        unite(left, right);
      }
    }
  }
  const buckets = new Map<string, string[]>();
  for (const path of paths) {
    const root = find(path);
    const list = buckets.get(root) ?? [];
    list.push(path);
    buckets.set(root, list);
  }
  return [...buckets.values()]
    .map((list) => [...list].sort((left, right) => left.localeCompare(right)))
    .filter((list) => list.length >= 2);
};

export const discoverLinkInvariants = (
  paths: PathStats[],
  documents: Record<string, unknown>[],
): ProfileLinkFields => {
  const links = emptyProfileLinks();
  const identifierPaths = paths
    .filter(isIdLike)
    .map((item) => item.path)
    .sort((left, right) => left.localeCompare(right));
  const dateShiftPaths = paths
    .filter(isDateLike)
    .map((item) => item.path)
    .sort((left, right) => left.localeCompare(right));
  links.identifierPaths = identifierPaths;
  links.dateShiftPaths = dateShiftPaths;
  const pathSet = new Set(paths.map((item) => item.path));
  if (pathSet.has('docDate') && pathSet.has('creationDateTime')) {
    links.dateOrderInvariants.push({
      earlierPath: 'docDate',
      laterPath: 'creationDateTime',
    });
  }
  if (pathSet.has('creationDateTime') && pathSet.has('modificationDateTime')) {
    links.dateOrderInvariants.push({
      earlierPath: 'creationDateTime',
      laterPath: 'modificationDateTime',
    });
  }
  const arrayPaths = paths
    .filter((item) => item.pathClass === 'array')
    .map((item) => item.path);
  const parentPath = pathSet.has('id') ? 'id' : undefined;
  if (parentPath) {
    for (const arrayPath of arrayPaths) {
      const prefix = `${arrayPath}.`;
      for (const child of identifierPaths) {
        if (!child.startsWith(prefix)) {
          continue;
        }
        const childRel = child.slice(prefix.length);
        if (childAlwaysEqualsParent(documents, parentPath, arrayPath, childRel)) {
          links.parentChildInvariants.push({
            parentPath,
            childPath: childRel,
            arrayPath,
          });
        }
      }
    }
  }
  const rootLinkable = [...identifierPaths, ...dateShiftPaths].filter(
    (path) => !arrayPaths.some((arrayPath) => path.startsWith(`${arrayPath}.`)),
  );
  for (const group of groupsFromPairs(rootLinkable, (left, right) =>
    pairAlwaysEqual(documents, left, right),
  )) {
    links.valueEqualities.push({ scope: 'document', paths: group });
  }
  for (const arrayPath of arrayPaths) {
    const prefix = `${arrayPath}.`;
    const nested = [...identifierPaths, ...dateShiftPaths].filter((path) =>
      path.startsWith(prefix),
    );
    const relatives = nested.map((path) => path.slice(prefix.length));
    for (const group of groupsFromPairs(relatives, (left, right) =>
      itemPairAlwaysEqual(documents, arrayPath, left, right),
    )) {
      links.valueEqualities.push({
        scope: 'array-item',
        arrayPath,
        paths: group.map((item) => `${arrayPath}.${item}`),
      });
    }
  }
  return links;
};

export const attachLinkInvariants = (
  version: ProfileVersion,
  documents: Record<string, unknown>[],
): ProfileVersion => ({
  ...version,
  ...discoverLinkInvariants(version.paths, documents),
});
