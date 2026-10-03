import { Injectable } from '@nestjs/common';
import type {
  IndexMapping,
  MappingQuery,
} from '@repositories/opensearch-index.port';
import { NeighborIndexGateway } from '../neighbor-index-gateway';
import { throwIfForbidden } from '../../shared/translate-neighbor-http';

@Injectable()
export class NeighborIndexMappingRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async getMapping(query: MappingQuery): Promise<IndexMapping> {
    return this.gateway.orFallback(
      (local) => local.getMapping(query),
      async () => {
        const response = await this.gateway.http.send<IndexMapping>(
          'get',
          `/internal/v1/indexes/${query.index}/mapping`,
          {
            caller: 'NeighborIndexHttpClient',
            params: { contour: query.contour },
          },
        );
        throwIfForbidden(response, 'prod_target');
        return response.data;
      },
    );
  }
}
