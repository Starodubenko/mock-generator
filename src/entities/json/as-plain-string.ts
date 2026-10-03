export const asPlainString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return asPlainString(value[0], fallback);
  }
  return fallback;
};
