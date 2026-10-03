import { buildSchemaTree } from './schema-tree';

describe('buildSchemaTree', () => {
  it('should_nest_dotted_paths_like_the_trained_document', () => {
    const tree = buildSchemaTree([
      { path: 'id', pathClass: 'identifier' },
      { path: 'nested', pathClass: 'nested' },
      {
        path: 'nested.code',
        pathClass: 'category',
        categoryValues: ['type-a'],
      },
      { path: 'nested.flag', pathClass: 'boolean' },
      { path: 'tags', pathClass: 'array', itemPathClass: 'category' },
    ]);
    expect(tree.map((item) => item.name)).toEqual([
      'id',
      'nested',
      'tags',
    ]);
    expect(tree[1]?.pathClass).toBe('nested');
    expect(tree[1]?.children.map((item) => item.name)).toEqual([
      'code',
      'flag',
    ]);
    expect(tree[1]?.children[1]?.path).toBe('nested.flag');
    expect(tree[2]?.itemPathClass).toBe('category');
    expect(tree[2]?.children).toEqual([]);
  });

  it('should_nest_object_array_item_fields_like_a_plain_object', () => {
    const tree = buildSchemaTree([
      { path: 'markers', pathClass: 'array', itemPathClass: 'nested' },
      { path: 'markers.code', pathClass: 'category', categoryValues: ['IN'] },
      { path: 'markers.active', pathClass: 'boolean' },
    ]);
    expect(tree[0]?.name).toBe('markers');
    expect(tree[0]?.pathClass).toBe('array');
    expect(tree[0]?.itemPathClass).toBe('nested');
    expect(tree[0]?.children.map((item) => item.name)).toEqual([
      'code',
      'active',
    ]);
    expect(tree[0]?.children[0]?.path).toBe('markers.code');
    expect(tree[0]?.children[1]?.pathClass).toBe('boolean');
  });

  it('should_create_implicit_object_when_parent_path_is_missing', () => {
    const tree = buildSchemaTree([
      { path: 'nested.flag', pathClass: 'boolean' },
    ]);
    expect(tree[0]?.name).toBe('nested');
    expect(tree[0]?.pathClass).toBe('nested');
    expect(tree[0]?.children[0]?.pathClass).toBe('boolean');
  });
});
