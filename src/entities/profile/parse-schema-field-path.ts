const SEGMENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const parseSchemaFieldSegment = (value: string): string | null => {
  const trimmed = value.trim();
  if (!SEGMENT.test(trimmed)) {
    return null;
  }
  return trimmed;
};

export const parseSchemaFieldPath = (value: string): string | null => {
  const parts = value
    .split('.')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  const segments = parts.map((item) => parseSchemaFieldSegment(item));
  if (segments.some((item) => item === null)) {
    return null;
  }
  return segments.join('.');
};

export const remapSchemaPath = (
  path: string,
  namesByOriginalPath: Record<string, string>,
): string => {
  const segments = path.split('.').filter(Boolean);
  let acc = '';
  return segments
    .map((segment) => {
      acc = acc ? `${acc}.${segment}` : segment;
      return parseSchemaFieldSegment(namesByOriginalPath[acc] ?? '') ?? segment;
    })
    .join('.');
};
