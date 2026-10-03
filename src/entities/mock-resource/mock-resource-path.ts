export const MOCK_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
] as const;

export type MockHttpMethod = (typeof MOCK_HTTP_METHODS)[number];

const MAX_PATH_LENGTH = 256;
const MAX_GROUP_LENGTH = 64;
const MAX_SUMMARY_LENGTH = 200;

export const normalizeMockResourcePath = (raw: string): string | null => {
  const path = raw.trim();
  if (!path.startsWith('/')) {
    return null;
  }
  if (
    path.includes('..') ||
    path.includes('//') ||
    path.includes('?') ||
    path.includes('#')
  ) {
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

export const normalizeMockHttpMethod = (raw: string): MockHttpMethod | null => {
  const method = raw.trim().toUpperCase();
  return MOCK_HTTP_METHODS.includes(method as MockHttpMethod)
    ? (method as MockHttpMethod)
    : null;
};

export const normalizeMockGroup = (raw: string): string | null => {
  const name = raw.trim();
  if (!name || name.length > MAX_GROUP_LENGTH) {
    return null;
  }
  if (
    name.includes('/') ||
    name.includes('?') ||
    name.includes('#') ||
    name.includes('..')
  ) {
    return null;
  }
  return name;
};

export const normalizeMockSummary = (raw: string): string =>
  raw.trim().slice(0, MAX_SUMMARY_LENGTH);

export const mockResourceKey = (method: string, path: string): string =>
  `${method} ${path}`;

const RESERVED_PREFIXES = [
  '/api/v1',
  '/api/docs',
  '/api/docs-json',
  '/jobs',
  '/profiles',
  '/document-types',
  '/mocks',
  '/console',
  '/src',
  '/assets',
  '/node_modules',
];

export const isReservedConsolePath = (path: string): boolean => {
  if (path === '/' || path === '/favicon.ico') {
    return true;
  }
  if (path.startsWith('/@')) {
    return true;
  }
  return RESERVED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
};
