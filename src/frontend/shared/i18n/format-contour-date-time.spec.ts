import { formatContourDateTime } from './format-contour-date-time';

describe('formatContourDateTime', () => {
  it('should_format_iso_in_contour_zone', () => {
    expect(
      formatContourDateTime('2026-09-24T18:00:00.000Z', 'Europe/Moscow'),
    ).toBe('24.09.2026, 21:00');
  });

  it('should_return_empty_for_invalid_iso', () => {
    expect(formatContourDateTime('not-a-date', 'Europe/Moscow')).toBe('');
  });
});
