import { flattenMappingProperties } from './index-mapping';

describe('flattenMappingProperties', () => {
  it('should_flatten_nested_object_fields', () => {
    const fields = flattenMappingProperties({
      status: { type: 'keyword' },
      nested: {
        type: 'object',
        properties: { code: { type: 'keyword' }, active: { type: 'boolean' } },
      },
    });
    expect(fields).toEqual([
      { path: 'status', type: 'keyword', ignoreAbove: undefined },
      { path: 'nested.code', type: 'keyword', ignoreAbove: undefined },
      { path: 'nested.active', type: 'boolean', ignoreAbove: undefined },
    ]);
  });
});
