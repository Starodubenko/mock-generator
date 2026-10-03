import { createGatewayDouble } from '../gateway-double';
import { NeighborIndexRefreshRepository } from './neighbor-index-refresh.repository';

describe('NeighborIndexRefreshRepository', () => {
  it('should_refresh_without_index_in_body', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({ status: 200, data: { refreshed: true } });
    await expect(
      new NeighborIndexRefreshRepository(gateway).refresh({
        contour: 'test-stand',
        index: 'documents-synthetic',
      }),
    ).resolves.toEqual({ refreshed: true });
    expect(send).toHaveBeenCalledWith(
      'post',
      '/internal/v1/indexes/documents-synthetic:refresh',
      {
        caller: 'NeighborIndexHttpClient',
        data: { contour: 'test-stand' },
      },
    );
  });
});
