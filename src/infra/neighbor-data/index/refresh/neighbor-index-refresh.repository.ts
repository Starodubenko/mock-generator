import { Injectable } from '@nestjs/common';
import type {
  RefreshCommand,
  RefreshResult,
} from '@repositories/opensearch-index.port';
import { NeighborIndexGateway } from '../neighbor-index-gateway';
import { throwIfForbidden } from '../../shared/translate-neighbor-http';

@Injectable()
export class NeighborIndexRefreshRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async refresh(command: RefreshCommand): Promise<RefreshResult> {
    return this.gateway.orFallback(
      (local) => local.refresh(command),
      async () => {
        const response = await this.gateway.http.send<RefreshResult>(
          'post',
          `/internal/v1/indexes/${command.index}:refresh`,
          {
            caller: 'NeighborIndexHttpClient',
            data: { contour: command.contour },
          },
        );
        throwIfForbidden(response, 'prod_target');
        return response.data;
      },
    );
  }
}
