import { Injectable } from '@nestjs/common';
import type {
  UpsertBatchCommand,
  UpsertBatchResult,
} from '@repositories/opensearch-index.port';
import { NeighborIndexGateway } from '../neighbor-index-gateway';
import { upsertFromNeighborResponse } from '../../shared/translate-neighbor-http';

@Injectable()
export class NeighborDocumentBatchRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async upsertBatch(command: UpsertBatchCommand): Promise<UpsertBatchResult> {
    return this.gateway.orFallback(
      (local) => local.upsertBatch(command),
      async () => {
        const response = await this.gateway.http.send(
          'put',
          `/internal/v1/indexes/${command.index}/documents:batch`,
          {
            caller: 'NeighborIndexHttpClient',
            data: {
              contour: command.contour,
              jobId: command.jobId,
              batchNo: command.batchNo,
              mode: command.mode,
              documents: command.documents,
            },
            jobId: command.jobId,
            batchNo: command.batchNo,
          },
        );
        return upsertFromNeighborResponse(response);
      },
    );
  }
}
