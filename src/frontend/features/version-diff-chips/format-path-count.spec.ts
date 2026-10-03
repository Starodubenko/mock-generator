import { formatFieldPhrase, formatPathCount } from './format-path-count';

describe('formatPathCount', () => {
  it('should_print_the_number', () => {
    expect(formatPathCount(0)).toBe('0');
    expect(formatPathCount(312)).toBe('312');
  });
});

describe('formatFieldPhrase', () => {
  it('should_pick_russian_plural', () => {
    expect(formatFieldPhrase(1)).toBe('1 поле');
    expect(formatFieldPhrase(2)).toBe('2 поля');
    expect(formatFieldPhrase(5)).toBe('5 полей');
    expect(formatFieldPhrase(11)).toBe('11 полей');
    expect(formatFieldPhrase(21)).toBe('21 поле');
    expect(formatFieldPhrase(312)).toBe('312 полей');
  });
});
