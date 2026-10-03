import { formatGeneratedAt, localCalendarDay } from './calendar-day';

describe('calendar-day', () => {
  it('should_extract_calendar_day_from_iso', () => {
    expect(localCalendarDay('2026-09-24T21:00:00+03:00', 'Europe/Moscow')).toBe(
      '2026-09-24',
    );
  });

  it('should_format_now_in_contour_zone', () => {
    expect(
      formatGeneratedAt(new Date('2026-09-24T18:00:00.000Z'), 'Europe/Moscow'),
    ).toBe('2026-09-24T21:00:00+03:00');
  });
});
