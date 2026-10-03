import { asGoldenFilters, goldenFiltersToQuery, localCalendarDay } from './golden-filters';

describe('golden-filters', () => {
  it('should_read_generator_filters_form', () => {
    expect(asGoldenFilters({ query: {} })).toBeNull();
    expect(asGoldenFilters({ filters: { status: 'NEW' } })).toEqual({ status: 'NEW' });
    expect(localCalendarDay('2026-09-24T21:00:00+03:00')).toBe('2026-09-24');
  });

  it('should_build_term_and_day_query', () => {
    expect(
      goldenFiltersToQuery({
        status: 'NEW',
        messageType: 'type-a',
        goldenDay: '2026-09-24T21:00:00+03:00',
        goldenUiToday: true,
      }),
    ).toEqual({
      bool: {
        must: [
          { term: { status: 'NEW' } },
          { term: { messageType: 'type-a' } },
          {
            range: {
              creationDateTime: {
                gte: '2026-09-24T00:00:00',
                lte: '2026-09-24T23:59:59.999',
              },
            },
          },
          { exists: { field: 'status' } },
          { exists: { field: 'creationDateTime' } },
        ],
      },
    });
  });
});
