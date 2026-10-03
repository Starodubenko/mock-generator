import {
  parseSchemaFieldPath,
  parseSchemaFieldSegment,
  remapSchemaPath,
} from './parse-schema-field-path';

describe('parseSchemaFieldSegment', () => {
  it('should_accept_identifier_segments', () => {
    expect(parseSchemaFieldSegment('status')).toBe('status');
    expect(parseSchemaFieldSegment(' flag ')).toBe('flag');
    expect(parseSchemaFieldSegment('_meta')).toBe('_meta');
  });

  it('should_reject_empty_and_unsafe', () => {
    expect(parseSchemaFieldSegment('')).toBeNull();
    expect(parseSchemaFieldSegment('message.type')).toBeNull();
    expect(parseSchemaFieldSegment('имя')).toBeNull();
    expect(parseSchemaFieldSegment('1status')).toBeNull();
  });
});

describe('parseSchemaFieldPath', () => {
  it('should_join_valid_segments', () => {
    expect(parseSchemaFieldPath('nested.flag')).toBe(
      'nested.flag',
    );
    expect(parseSchemaFieldPath('status')).toBe('status');
  });

  it('should_reject_blank_or_bad_segment', () => {
    expect(parseSchemaFieldPath('')).toBeNull();
    expect(parseSchemaFieldPath('foo.бар')).toBeNull();
  });
});

describe('remapSchemaPath', () => {
  it('should_rename_self_and_children', () => {
    expect(remapSchemaPath('status', { status: 'state' })).toBe('state');
    expect(
      remapSchemaPath('nested.flag', { nested: 'meta' }),
    ).toBe('meta.flag');
    expect(
      remapSchemaPath('nested.flag', {
        'nested.flag': 'flag',
      }),
    ).toBe('nested.flag');
  });

  it('should_keep_path_when_name_missing_or_invalid', () => {
    expect(remapSchemaPath('status', {})).toBe('status');
    expect(remapSchemaPath('status', { status: 'плохой' })).toBe('status');
  });
});
