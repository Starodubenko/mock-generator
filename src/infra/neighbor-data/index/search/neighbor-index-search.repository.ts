import { Injectable } from '@nestjs/common';
import type {
  PortSearchQuery,
  PortSearchResult,
} from '@repositories/opensearch-index.port';
import { NeighborIndexGateway } from '../neighbor-index-gateway';
import { throwIfForbidden } from '../../shared/translate-neighbor-http';

@Injectable()
export class NeighborIndexSearchRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async search(query: PortSearchQuery): Promise<PortSearchResult> {
    return this.gateway.orFallback(
      (local) => local.search(query),
      async () => {
        const response = await this.gateway.http.send<PortSearchResult>(
          'post',
          `/internal/v1/indexes/${query.index}/search`,
          {
            caller: 'NeighborIndexHttpClient',
            data: { contour: query.contour, body: query.body },
          },
        );
        throwIfForbidden(response, 'prod_target');
        return response.data;
      },
    );
  }
}
