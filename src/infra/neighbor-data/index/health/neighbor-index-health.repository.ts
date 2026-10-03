import { Injectable } from '@nestjs/common';
import { NeighborIndexGateway } from '../neighbor-index-gateway';

@Injectable()
export class NeighborIndexHealthRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async ping(): Promise<boolean> {
    return this.gateway.orFallback(
      (local) => local.ping(),
      async () => {
        try {
          const response = await this.gateway.http.send(
            'get',
            '/internal/v1/health',
            { caller: 'NeighborIndexHttpClient' },
          );
          return response.status === 200;
        } catch {
          return false;
        }
      },
    );
  }
}
