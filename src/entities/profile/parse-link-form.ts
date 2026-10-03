import { isDocumentTypeSlug } from '../document-type/document-type-slug';
import { SchemaEditConflictError } from './apply-schema-edits';
import type { ProfileLinkFields } from './profile-links';
import { emptyProfileLinks } from './profile-links';

export const parseLinkForm = (
  body: Record<string, string | undefined>,
  allowedPaths: Set<string>,
): ProfileLinkFields => {
  const links = emptyProfileLinks();
  const indexes = new Set<string>();
  for (const key of Object.keys(body)) {
    if (key.startsWith('linkKind:')) {
      indexes.add(key.slice('linkKind:'.length));
    }
  }
  const sorted = [...indexes].sort((left, right) => Number(left) - Number(right));
  const requirePath = (path: string): string => {
    if (!allowedPaths.has(path)) {
      throw new SchemaEditConflictError('Путь связи отсутствует в схеме');
    }
    return path;
  };
  for (const index of sorted) {
    const kind = body[`linkKind:${index}`];
    if (kind === 'parent-child') {
      const parentPath = requirePath(body[`linkParent:${index}`] ?? '');
      const arrayPath = requirePath(body[`linkArray:${index}`] ?? '');
      const childPath = body[`linkChild:${index}`] ?? '';
      if (!childPath) {
        throw new SchemaEditConflictError('Некорректная связь родитель/ребёнок');
      }
      const fullChild = `${arrayPath}.${childPath}`;
      if (!allowedPaths.has(fullChild)) {
        throw new SchemaEditConflictError('Путь связи отсутствует в схеме');
      }
      links.parentChildInvariants.push({ parentPath, childPath, arrayPath });
      continue;
    }
    if (kind === 'equality') {
      const scope = body[`linkScope:${index}`] === 'array-item' ? 'array-item' : 'document';
      const paths = (body[`linkPaths:${index}`] ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map(requirePath);
      if (paths.length < 2) {
        throw new SchemaEditConflictError('Группа равенства нужна из двух путей');
      }
      const arrayPath =
        scope === 'array-item' ? requirePath(body[`linkArray:${index}`] ?? '') : undefined;
      links.valueEqualities.push({ scope, arrayPath, paths });
      continue;
    }
    if (kind === 'date-order') {
      links.dateOrderInvariants.push({
        earlierPath: requirePath(body[`linkEarlier:${index}`] ?? ''),
        laterPath: requirePath(body[`linkLater:${index}`] ?? ''),
      });
      continue;
    }
    if (kind === 'cross-type') {
      const remoteField = (body[`linkRemoteField:${index}`] ?? 'id').trim() || 'id';
      const remoteDocumentType = body[`linkRemoteType:${index}`] ?? '';
      if (!isDocumentTypeSlug(remoteDocumentType)) {
        throw new SchemaEditConflictError('Некорректный связанный тип');
      }
      links.crossTypeLinks.push({
        localPath: requirePath(body[`linkLocal:${index}`] ?? ''),
        remoteDocumentType,
        remoteField,
      });
    }
  }
  return links;
};
