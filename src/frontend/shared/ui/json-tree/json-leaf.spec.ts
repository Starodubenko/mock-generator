import { formatJsonLeaf, jsonLeafKind } from './json-leaf';

describe('json-leaf', () => {
  it('should_quote_strings_and_keep_scalars', () => {
    expect(formatJsonLeaf('NEW')).toBe('"NEW"');
    expect(formatJsonLeaf(12)).toBe('12');
    expect(formatJsonLeaf(true)).toBe('true');
    expect(formatJsonLeaf(null)).toBe('null');
    expect(jsonLeafKind('NEW')).toBe('string');
    expect(jsonLeafKind(null)).toBe('null');
  });
});
