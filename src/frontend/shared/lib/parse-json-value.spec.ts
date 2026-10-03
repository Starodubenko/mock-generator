import { parseDraftJsonValues, parseJsonValue } from './parse-json-value';

describe('parseJsonValue', () => {
  it('should_parse_object_and_keep_invalid_as_string', () => {
    expect(parseJsonValue('{"status":"NEW"}')).toEqual({ status: 'NEW' });
    expect(parseJsonValue('{not-json')).toBe('{not-json');
  });

  it('should_skip_empty_draft_bodies', () => {
    expect(parseDraftJsonValues(['', '{"id":"a"}', ''])).toEqual([{ id: 'a' }]);
  });
});
