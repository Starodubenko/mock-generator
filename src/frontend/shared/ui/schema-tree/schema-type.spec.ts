import {
  formatTypeVariants,
  isCollapsibleNode,
  isSchemaObject,
  swaggerTypeColor,
  swaggerTypeLabel,
} from './schema-type';

describe('schema-type', () => {
  it('should_map_path_classes_to_swagger_like_labels_and_colors', () => {
    expect(swaggerTypeLabel('category')).toBe('string');
    expect(swaggerTypeLabel('datetime', 'date')).toBe('date');
    expect(swaggerTypeLabel('datetime', 'date-time')).toBe('date-time');
    expect(swaggerTypeLabel('nested')).toBe('object');
    expect(swaggerTypeColor('string')).toBe('#55a538');
    expect(swaggerTypeColor('boolean')).toBe('#9b59b6');
    expect(swaggerTypeColor('integer')).toBe('#1a73e8');
    expect(isSchemaObject('nested', 0)).toBe(true);
    expect(isSchemaObject('boolean', 0)).toBe(false);
    expect(isCollapsibleNode('array', 0)).toBe(false);
    expect(isCollapsibleNode('array', 0, 'nested')).toBe(true);
    expect(isCollapsibleNode('array', 1)).toBe(true);
    expect(isCollapsibleNode('boolean', 0)).toBe(false);
    expect(
      formatTypeVariants({
        pathClass: 'datetime',
        datetimeFormat: 'date',
        typeVariants: ['date', 'null'],
      }),
    ).toEqual(['date', 'null']);
  });
});
