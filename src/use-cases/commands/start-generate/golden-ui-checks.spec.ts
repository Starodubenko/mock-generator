import { effectiveGoldenValues, GOLDEN_UI_STATUSES } from './golden-ui-checks';

describe('effectiveGoldenValues', () => {
  it('should_return_defaults_without_constraints', () => {
    expect(
      effectiveGoldenValues(GOLDEN_UI_STATUSES, undefined, 'status'),
    ).toEqual([...GOLDEN_UI_STATUSES]);
  });

  it('should_intersect_allow_list_with_defaults', () => {
    expect(
      effectiveGoldenValues(
        GOLDEN_UI_STATUSES,
        [{ path: 'status', kind: 'category', values: ['NEW', 'CLOSED'] }],
        'status',
      ),
    ).toEqual(['NEW']);
  });

  it('should_use_allow_list_when_no_intersection', () => {
    expect(
      effectiveGoldenValues(
        GOLDEN_UI_STATUSES,
        [{ path: 'status', kind: 'category', values: ['CLOSED'] }],
        'status',
      ),
    ).toEqual(['CLOSED']);
  });
});
