import {
  collectPathValues,
  getByPath,
  hasPathKey,
  replaceByPath,
  setByPath,
} from './path-value';

describe('path-value', () => {
  const document = {
    markers: [
      { code: 'IN', active: true },
      { code: 'OUT', active: false },
    ],
    tags: ['LOCAL'],
  };

  it('should_walk_into_array_objects_for_dotted_item_paths', () => {
    expect(getByPath(document, 'markers')).toEqual(document.markers);
    expect(getByPath(document, 'markers.code')).toBe('IN');
    expect(getByPath(document, 'markers.active')).toBe(true);
    expect(hasPathKey(document, 'markers')).toBe(true);
    expect(hasPathKey(document, 'markers.code')).toBe(true);
    expect(hasPathKey({ markers: [] }, 'markers.code')).toBe(false);
    expect(collectPathValues(document, 'markers')).toEqual([document.markers]);
    expect(collectPathValues(document, 'markers.code')).toEqual(['IN', 'OUT']);
    expect(collectPathValues(document, 'tags')).toEqual([['LOCAL']]);
  });

  it('should_write_child_fields_into_existing_array_objects', () => {
    const target: Record<string, unknown> = { markers: [{}] };
    setByPath(target, 'markers.code', 'IN');
    setByPath(target, 'markers.active', true);
    expect(target).toEqual({ markers: [{ code: 'IN', active: true }] });
  });

  it('should_replace_array_at_dotted_path', () => {
    const target: Record<string, unknown> = {
      hits: { total: 1, hits: [{ id: 'a' }] },
    };
    replaceByPath(target, 'hits.hits', [{ id: '1' }, { id: '2' }]);
    expect(target).toEqual({
      hits: { total: 1, hits: [{ id: '1' }, { id: '2' }] },
    });
  });
});
