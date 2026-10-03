import {
  parsePathClassSelectValue,
  toPathClassSelectValue,
} from './parse-path-class-select';

describe('parsePathClassSelectValue', () => {
  it('should_round_trip_datetime_and_enum', () => {
    expect(toPathClassSelectValue('datetime', 'date')).toBe('datetime:date');
    expect(parsePathClassSelectValue('datetime:date')).toEqual({
      pathClass: 'datetime',
      datetimeFormat: 'date',
    });
    expect(parsePathClassSelectValue('category')).toEqual({
      pathClass: 'category',
    });
    expect(parsePathClassSelectValue('not-a-type')).toBeNull();
  });

  it('should_round_trip_array_item_type', () => {
    expect(toPathClassSelectValue('array', undefined, 'boolean')).toBe(
      'array:boolean',
    );
    expect(toPathClassSelectValue('array', undefined, 'datetime', 'date')).toBe(
      'array:datetime:date',
    );
    expect(parsePathClassSelectValue('array:boolean')).toEqual({
      pathClass: 'array',
      itemPathClass: 'boolean',
    });
    expect(parsePathClassSelectValue('array:datetime:date')).toEqual({
      pathClass: 'array',
      itemPathClass: 'datetime',
      itemDatetimeFormat: 'date',
    });
    expect(parsePathClassSelectValue('array')).toEqual({
      pathClass: 'array',
      itemPathClass: 'free-text',
    });
  });
});
