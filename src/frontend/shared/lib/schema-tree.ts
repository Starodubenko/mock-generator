export type SchemaPath = {
  path: string;
  pathClass: string;
  datetimeFormat?: string;
  categoryValues?: string[];
  itemPathClass?: string;
  itemDatetimeFormat?: string;
  itemCategoryValues?: string[];
  typeVariants?: string[];
  nullRate?: number;
};

export type SchemaNode = {
  name: string;
  path: string;
  pathClass: string;
  datetimeFormat?: string;
  categoryValues?: string[];
  itemPathClass?: string;
  itemDatetimeFormat?: string;
  itemCategoryValues?: string[];
  typeVariants?: string[];
  nullRate?: number;
  children: SchemaNode[];
};

type DraftNode = {
  name: string;
  path: string;
  pathClass: string;
  datetimeFormat?: string;
  categoryValues?: string[];
  itemPathClass?: string;
  itemDatetimeFormat?: string;
  itemCategoryValues?: string[];
  typeVariants?: string[];
  nullRate?: number;
  children: Map<string, DraftNode>;
};

const applyKnown = (draft: DraftNode, known: SchemaPath | undefined): void => {
  if (!known) {
    return;
  }
  draft.pathClass = known.pathClass;
  draft.datetimeFormat = known.datetimeFormat;
  draft.categoryValues = known.categoryValues;
  draft.itemPathClass = known.itemPathClass;
  draft.itemDatetimeFormat = known.itemDatetimeFormat;
  draft.itemCategoryValues = known.itemCategoryValues;
  draft.typeVariants = known.typeVariants;
  draft.nullRate = known.nullRate;
};

export const buildSchemaTree = (paths: SchemaPath[]): SchemaNode[] => {
  const root = new Map<string, DraftNode>();
  const byPath = new Map(paths.map((item) => [item.path, item]));

  const ensure = (segments: string[]): void => {
    let level = root;
    let acc = '';
    for (const segment of segments) {
      acc = acc ? `${acc}.${segment}` : segment;
      let next = level.get(segment);
      if (!next) {
        next = {
          name: segment,
          path: acc,
          pathClass: byPath.get(acc)?.pathClass ?? 'nested',
          datetimeFormat: byPath.get(acc)?.datetimeFormat,
          categoryValues: byPath.get(acc)?.categoryValues,
          itemPathClass: byPath.get(acc)?.itemPathClass,
          itemDatetimeFormat: byPath.get(acc)?.itemDatetimeFormat,
          itemCategoryValues: byPath.get(acc)?.itemCategoryValues,
          typeVariants: byPath.get(acc)?.typeVariants,
          nullRate: byPath.get(acc)?.nullRate,
          children: new Map(),
        };
        level.set(segment, next);
      } else {
        applyKnown(next, byPath.get(acc));
      }
      level = next.children;
    }
  };

  for (const item of paths) {
    const segments = item.path.split('.').filter(Boolean);
    if (segments.length > 0) {
      ensure(segments);
    }
  }

  const toNodes = (level: Map<string, DraftNode>): SchemaNode[] =>
    [...level.values()].map((item) => ({
      name: item.name,
      path: item.path,
      pathClass: item.pathClass,
      datetimeFormat: item.datetimeFormat,
      categoryValues: item.categoryValues,
      itemPathClass: item.itemPathClass,
      itemDatetimeFormat: item.itemDatetimeFormat,
      itemCategoryValues: item.itemCategoryValues,
      typeVariants: item.typeVariants,
      nullRate: item.nullRate,
      children: toNodes(item.children),
    }));

  return toNodes(root);
};
