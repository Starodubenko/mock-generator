import { Injectable } from '@nestjs/common';
import type { PurgeJobCommand } from '@repositories/opensearch-index.port';
import { NeighborIndexGateway } from '../neighbor-index-gateway';
import { throwIfForbidden } from '../../shared/translate-neighbor-http';

@Injectable()
export class NeighborJobPurgeRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async purgeJobDocuments(command: PurgeJobCommand): Promise<void> {
    return this.gateway.orFallback(
      (local) => local.purgeJobDocuments(command),
      async () => {
        const response = await this.gateway.http.send(
          'delete',
          `/internal/v1/indexes/${command.index}/documents?contour=${command.contour}&jobId=${command.jobId}`,
          { caller: 'NeighborIndexHttpClient' },
        );
        throwIfForbidden(response, 'prod_target');
      },
    );
  }
}
