export const isDocumentTypeSlug = (value: string): boolean =>
  /^[a-z][a-z0-9-]{0,62}$/.test(value);

export const normalizeDocumentTypeSlug = (value: string): string =>
  value.trim().toLowerCase();
