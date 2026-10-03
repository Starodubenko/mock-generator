export const parseJsonValue = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

export const parseDraftJsonValues = (bodies: string[]): unknown[] =>
  bodies.filter((body) => body.length > 0).map((body) => parseJsonValue(body));
