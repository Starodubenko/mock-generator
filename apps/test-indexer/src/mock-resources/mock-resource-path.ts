const MAX_PATH_LENGTH = 256;

export const normalizeMockResourcePath = (raw: string): string | null => {
  const path = raw.trim();
  if (!path.startsWith('/')) {
    return null;
  }
  if (path.includes('..') || path.includes('//') || path.includes('?') || path.includes('#')) {
    return null;
  }
  if (path === '/internal' || path.startsWith('/internal/')) {
    return null;
  }
  if (path.length > MAX_PATH_LENGTH) {
    return null;
  }
  return path;
};
