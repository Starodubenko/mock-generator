export const getByPath = (value: unknown, path: string): unknown => {
  if (!path) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = getByPath(item, path);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }
  if (value === null || value === undefined || typeof value !== 'object') {
    return undefined;
  }
  const [head, ...rest] = path.split('.');
  const child = (value as Record<string, unknown>)[head];
  return rest.length === 0 ? child : getByPath(child, rest.join('.'));
};

export const hasPathKey = (value: unknown, path: string): boolean => {
  if (!path) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasPathKey(item, path));
  }
  if (value === null || value === undefined || typeof value !== 'object') {
    return false;
  }
  const [head, ...rest] = path.split('.');
  const record = value as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, head)) {
    return false;
  }
  return rest.length === 0 ? true : hasPathKey(record[head], rest.join('.'));
};

export const collectPathValues = (value: unknown, path: string): unknown[] => {
  if (!path) {
    return value === undefined ? [] : [value];
  }
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectPathValues(item, path));
  }
  if (typeof value !== 'object') {
    return [];
  }
  const [head, ...rest] = path.split('.');
  const child = (value as Record<string, unknown>)[head];
  if (rest.length === 0) {
    return child === undefined ? [] : [child];
  }
  return collectPathValues(child, rest.join('.'));
};

export const replaceByPath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    return;
  }
  const walk = (node: Record<string, unknown>, parts: string[]): void => {
    const [head, ...rest] = parts;
    if (!head) {
      return;
    }
    if (rest.length === 0) {
      node[head] = value;
      return;
    }
    const next = node[head];
    if (Array.isArray(next)) {
      next.forEach((item) => {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          walk(item as Record<string, unknown>, rest);
        }
      });
      return;
    }
    if (next === null || typeof next !== 'object') {
      node[head] = {};
    }
    walk(node[head] as Record<string, unknown>, rest);
  };
  walk(target, segments);
};

export const setByPath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const [head, ...rest] = path.split('.');
  if (rest.length === 0) {
    target[head] = value;
    return;
  }
  const next = target[head];
  if (Array.isArray(next)) {
    const remaining = rest.join('.');
    next.forEach((item) => {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        setByPath(item as Record<string, unknown>, remaining, value);
      }
    });
    return;
  }
  if (next === null || typeof next !== 'object') {
    target[head] = {};
  }
  setByPath(target[head] as Record<string, unknown>, rest.join('.'), value);
};
