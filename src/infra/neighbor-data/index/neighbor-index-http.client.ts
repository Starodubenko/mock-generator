import { Injectable } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import {
  IndexMapping,
  OpenSearchIndexPort,
  OpenSnapshotResult,
  PortSearchResult,
  ReadSnapshotResult,
  RefreshResult,
} from '@repositories/opensearch-index.port';
import { LocalOpenSearchIndexAdapter } from '../../local-data/local-opensearch-index.adapter';
import { NeighborCorpusSnapshotRepository } from './corpus-snapshot/neighbor-corpus-snapshot.repository';
import { NeighborDocumentBatchRepository } from './document-batch/neighbor-document-batch.repository';
import { NeighborHttp } from '../shared/neighbor-http';
import { NeighborIndexGateway } from './neighbor-index-gateway';
import { NeighborIndexHealthRepository } from './health/neighbor-index-health.repository';
import { NeighborIndexMappingRepository } from './mapping/neighbor-index-mapping.repository';
import { NeighborIndexPolicy } from './neighbor-index-policy';
import { NeighborIndexRefreshRepository } from './refresh/neighbor-index-refresh.repository';
import { NeighborIndexSearchRepository } from './search/neighbor-index-search.repository';
import { NeighborJobPurgeRepository } from './job-purge/neighbor-job-purge.repository';

export const createNeighborIndexHttpClient = (
  http: HttpService,
  fallback?: LocalOpenSearchIndexAdapter,
): NeighborIndexHttpClient => {
  const gateway = new NeighborIndexGateway(new NeighborHttp(http), fallback);
  return new NeighborIndexHttpClient(
    new NeighborCorpusSnapshotRepository(gateway),
    new NeighborIndexMappingRepository(gateway),
    new NeighborDocumentBatchRepository(gateway),
    new NeighborIndexRefreshRepository(gateway),
    new NeighborIndexSearchRepository(gateway),
    new NeighborJobPurgeRepository(gateway),
    new NeighborIndexHealthRepository(gateway),
    new NeighborIndexPolicy(fallback),
  );
};

@Injectable()
export class NeighborIndexHttpClient extends OpenSearchIndexPort {
  constructor(
    private readonly snapshots: NeighborCorpusSnapshotRepository,
    private readonly mapping: NeighborIndexMappingRepository,
    private readonly batches: NeighborDocumentBatchRepository,
    private readonly refreshes: NeighborIndexRefreshRepository,
    private readonly searches: NeighborIndexSearchRepository,
    private readonly purges: NeighborJobPurgeRepository,
    private readonly health: NeighborIndexHealthRepository,
    private readonly policy: NeighborIndexPolicy,
  ) {
    super();
  }

  async openSnapshot(
    command: Parameters<OpenSearchIndexPort['openSnapshot']>[0],
  ): Promise<OpenSnapshotResult> {
    return this.snapshots.openSnapshot(command);
  }

  async readSnapshot(
    command: Parameters<OpenSearchIndexPort['readSnapshot']>[0],
  ): Promise<ReadSnapshotResult> {
    return this.snapshots.readSnapshot(command);
  }

  async closeSnapshot(
    command: Parameters<OpenSearchIndexPort['closeSnapshot']>[0],
  ): Promise<void> {
    return this.snapshots.closeSnapshot(command);
  }

  async getMapping(
    query: Parameters<OpenSearchIndexPort['getMapping']>[0],
  ): Promise<IndexMapping> {
    return this.mapping.getMapping(query);
  }

  async upsertBatch(
    command: Parameters<OpenSearchIndexPort['upsertBatch']>[0],
  ) {
    return this.batches.upsertBatch(command);
  }

  async refresh(
    command: Parameters<OpenSearchIndexPort['refresh']>[0],
  ): Promise<RefreshResult> {
    return this.refreshes.refresh(command);
  }

  async search(
    query: Parameters<OpenSearchIndexPort['search']>[0],
  ): Promise<PortSearchResult> {
    return this.searches.search(query);
  }

  async purgeJobDocuments(
    command: Parameters<OpenSearchIndexPort['purgeJobDocuments']>[0],
  ): Promise<void> {
    return this.purges.purgeJobDocuments(command);
  }

  isSyntheticIndex(index: string): boolean {
    return this.policy.isSyntheticIndex(index);
  }

  isSyntheticSource(sourceIndex: string): boolean {
    return this.policy.isSyntheticSource(sourceIndex);
  }

  isProdContour(contour: string): boolean {
    return this.policy.isProdContour(contour);
  }

  async ping(): Promise<boolean> {
    return this.health.ping();
  }
}
