export const TEST_INDEX_MAPPINGS = {
  dynamic: false as const,
  properties: {
    id: { type: 'keyword' },
    status: { type: 'keyword' },
    messageType: { type: 'keyword' },
    creationDateTime: { type: 'date' },
    modificationDateTime: { type: 'date' },
    tags: { type: 'keyword' },
    items: {
      type: 'nested',
      properties: {
        id: { type: 'keyword' },
        active: { type: 'boolean' },
      },
    },
  },
};

export type MappingField = {
  path: string;
  type: string;
  ignoreAbove?: number;
};

export const flattenMappingProperties = (
  properties: Record<string, unknown> | undefined,
  prefix = '',
): MappingField[] => {
  if (!properties) {
    return [];
  }
  const fields: MappingField[] = [];
  for (const [name, raw] of Object.entries(properties)) {
    const node = raw as {
      type?: string;
      properties?: Record<string, unknown>;
      fields?: Record<string, { ignore_above?: number }>;
    };
    const path = prefix ? `${prefix}.${name}` : name;
    if (node.properties) {
      fields.push(...flattenMappingProperties(node.properties, path));
      continue;
    }
    if (node.type) {
      fields.push({
        path,
        type: node.type,
        ignoreAbove: node.fields?.keyword?.ignore_above,
      });
    }
  }
  return fields;
};
