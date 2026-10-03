import { createGatewayDouble } from '../gateway-double';
import { NeighborIndexSearchRepository } from './neighbor-index-search.repository';

describe('NeighborIndexSearchRepository', () => {
  it('should_search_without_index_in_body', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({
      status: 200,
      data: { total: 1, ids: ['d1'] },
    });
    await expect(
      new NeighborIndexSearchRepository(gateway).search({
        contour: 'test-stand',
        index: 'documents-synthetic',
        body: { filters: { status: 'NEW' } },
      }),
    ).resolves.toEqual({ total: 1, ids: ['d1'] });
    expect(send).toHaveBeenCalledWith(
      'post',
      '/internal/v1/indexes/documents-synthetic/search',
      {
        caller: 'NeighborIndexHttpClient',
        data: {
          contour: 'test-stand',
          body: { filters: { status: 'NEW' } },
        },
      },
    );
  });
});
