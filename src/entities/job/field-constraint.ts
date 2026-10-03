export type FieldConstraint =
  | { path: string; kind: 'boolean'; values: boolean[] }
  | { path: string; kind: 'category'; values: string[] }
  | { path: string; kind: 'datetime'; values: string[] };

export const asFieldConstraints = (
  items:
    | Array<{ path: string; kind: string; values: Array<string | boolean> }>
    | undefined,
): FieldConstraint[] | undefined => {
  if (!items?.length) {
    return undefined;
  }
  return items.map((item) => {
    if (item.kind === 'boolean') {
      return {
        path: item.path,
        kind: 'boolean' as const,
        values: item.values.map((value) => value === true || value === 'true'),
      };
    }
    if (item.kind === 'category') {
      return {
        path: item.path,
        kind: 'category' as const,
        values: item.values.map(String),
      };
    }
    return {
      path: item.path,
      kind: 'datetime' as const,
      values: item.values.map(String),
    };
  });
};

export const normalizeFieldConstraints = (
  constraints: FieldConstraint[] | undefined,
): FieldConstraint[] => {
  if (!constraints?.length) {
    return [];
  }
  return [...constraints]
    .map((item) => {
      if (item.kind === 'boolean') {
        return {
          path: item.path,
          kind: 'boolean' as const,
          values: [...item.values].sort(
            (left, right) => Number(left) - Number(right),
          ),
        };
      }
      return {
        path: item.path,
        kind: item.kind,
        values: [...item.values].sort((left, right) =>
          left.localeCompare(right),
        ),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
};
