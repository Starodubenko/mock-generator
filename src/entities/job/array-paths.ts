import { asPlainString } from '../json/as-plain-string';
import type { ProfileVersion } from '../profile/profile.types';

const splitRaw = (value: unknown): string[] => {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items.flatMap((item) => asPlainString(item).split(/[,;\n]/));
};

export const normalizeArrayPaths = (value: unknown): string[] => {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const item of splitRaw(value)) {
    const path = item.trim();
    if (!path || seen.has(path)) {
      continue;
    }
    seen.add(path);
    paths.push(path);
  }
  return paths;
};

export const validateArrayPaths = (
  paths: string[],
  version: ProfileVersion,
): { ok: true } | { ok: false } => {
  const arrays = new Set(
    version.paths
      .filter((item) => item.pathClass === 'array')
      .map((item) => item.path),
  );
  if (paths.some((path) => !arrays.has(path))) {
    return { ok: false };
  }
  return { ok: true };
};
