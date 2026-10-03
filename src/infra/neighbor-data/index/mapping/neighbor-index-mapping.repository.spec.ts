import { createGatewayDouble } from '../gateway-double';
import { NeighborIndexMappingRepository } from './neighbor-index-mapping.repository';

describe('NeighborIndexMappingRepository', () => {
  it('should_get_mapping_without_index_in_query_body', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({
      status: 200,
      data: { index: 'documents-synthetic', dynamic: 'false', fields: [] },
    });
    await expect(
      new NeighborIndexMappingRepository(gateway).getMapping({
        contour: 'test-stand',
        index: 'documents-synthetic',
      }),
    ).resolves.toEqual({
      index: 'documents-synthetic',
      dynamic: 'false',
      fields: [],
    });
    expect(send).toHaveBeenCalledWith(
      'get',
      '/internal/v1/indexes/documents-synthetic/mapping',
      {
        caller: 'NeighborIndexHttpClient',
        params: { contour: 'test-stand' },
      },
    );
  });
});
