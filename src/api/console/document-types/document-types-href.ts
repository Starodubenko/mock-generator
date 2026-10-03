export const documentTypesHref = (
  contour: string,
  extras: Record<string, string | null | undefined> = {},
): string => {
  const params = new URLSearchParams({ contour });
  Object.entries(extras).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return `/document-types?${params.toString()}`;
};
