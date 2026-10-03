import { Injectable } from '@nestjs/common';
import type {
  CloseSnapshotCommand,
  OpenSnapshotCommand,
  OpenSnapshotResult,
  ReadSnapshotCommand,
  ReadSnapshotResult,
} from '@repositories/opensearch-index.port';
import { NeighborIndexGateway } from '../neighbor-index-gateway';
import { throwIfForbidden } from '../../shared/translate-neighbor-http';

@Injectable()
export class NeighborCorpusSnapshotRepository {
  constructor(private readonly gateway: NeighborIndexGateway) {}

  async openSnapshot(
    command: OpenSnapshotCommand,
  ): Promise<OpenSnapshotResult> {
    return this.gateway.orFallback(
      (local) => local.openSnapshot(command),
      async () => {
        const response = await this.gateway.http.send<OpenSnapshotResult>(
          'post',
          '/internal/v1/corpus/snapshots',
          { caller: 'NeighborIndexHttpClient', data: command },
        );
        throwIfForbidden(response, 'source_is_synthetic');
        return response.data;
      },
    );
  }

  async readSnapshot(
    command: ReadSnapshotCommand,
  ): Promise<ReadSnapshotResult> {
    return this.gateway.orFallback(
      (local) => local.readSnapshot(command),
      async () => {
        const response = await this.gateway.http.send<ReadSnapshotResult>(
          'post',
          `/internal/v1/corpus/snapshots/${command.snapshotId}/pages`,
          { caller: 'NeighborIndexHttpClient', data: command },
        );
        throwIfForbidden(response, 'source_is_synthetic');
        return response.data;
      },
    );
  }

  async closeSnapshot(command: CloseSnapshotCommand): Promise<void> {
    return this.gateway.orFallback(
      (local) => local.closeSnapshot(command),
      async () => {
        const response = await this.gateway.http.send(
          'delete',
          `/internal/v1/corpus/snapshots/${command.snapshotId}?contour=${command.contour}`,
          { caller: 'NeighborIndexHttpClient' },
        );
        throwIfForbidden(response, 'prod_target');
      },
    );
  }
}
