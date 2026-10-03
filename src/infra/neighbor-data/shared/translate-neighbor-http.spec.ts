import {
  throwIfForbidden,
  upsertFromNeighborResponse,
} from './translate-neighbor-http';

describe('translate-neighbor-http', () => {
  it('should_map_403_to_port_forbidden', () => {
    try {
      throwIfForbidden(
        { status: 403, data: { reason: 'source_is_synthetic' } },
        'prod_target',
      );
      throw new Error('expected throwIfForbidden to throw');
    } catch (error) {
      expect(error).toMatchObject({
        status: 403,
        reason: 'source_is_synthetic',
      });
    }
  });

  it('should_map_429_to_retry_same_batch', () => {
    expect(
      upsertFromNeighborResponse({ status: 429, data: { retryAfterMs: 25 } }),
    ).toEqual({
      accepted: [],
      rejected: [],
      retryAfterMs: 25,
    });
  });

  it('should_pass_200_upsert_body', () => {
    expect(
      upsertFromNeighborResponse({
        status: 200,
        data: { accepted: ['d1'], rejected: [] },
      }),
    ).toEqual({ accepted: ['d1'], rejected: [] });
  });
});
