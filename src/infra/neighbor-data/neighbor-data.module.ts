import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OPENSEARCH_INDEX_PORT } from '@repositories/opensearch-index.port';
import { PROCESS_STORE } from '@repositories/process-store.port';
import { MOCK_RESOURCE_PORT } from '@repositories/mock-resource.port';
import { LocalMockResourceAdapter } from '@infra/local-data/local-mock-resource.adapter';
import { NeighborMockResourceAdapter } from './mock-resources/neighbor-mock-resource.adapter';
import { NeighborIndexGateway } from './index/neighbor-index-gateway';
import { NeighborIndexHttpClient } from './index/neighbor-index-http.client';
import { NeighborIndexPolicy } from './index/neighbor-index-policy';
import { NeighborCorpusSnapshotRepository } from './index/corpus-snapshot/neighbor-corpus-snapshot.repository';
import { NeighborDocumentBatchRepository } from './index/document-batch/neighbor-document-batch.repository';
import { NeighborIndexHealthRepository } from './index/health/neighbor-index-health.repository';
import { NeighborJobPurgeRepository } from './index/job-purge/neighbor-job-purge.repository';
import { NeighborIndexMappingRepository } from './index/mapping/neighbor-index-mapping.repository';
import { NeighborIndexRefreshRepository } from './index/refresh/neighbor-index-refresh.repository';
import { NeighborIndexSearchRepository } from './index/search/neighbor-index-search.repository';
import { NeighborProcessStore } from './process-store/neighbor-process.store';
import { NeighborActivationRepository } from './process-store/activation/neighbor-activation.repository';
import { NeighborDocumentTypeRepository } from './process-store/document-type/neighbor-document-type.repository';
import { NeighborDraftRepository } from './process-store/draft/neighbor-draft.repository';
import { NeighborEnumExtraRepository } from './process-store/enum-extra/neighbor-enum-extra.repository';
import { NeighborIdempotencyRepository } from './process-store/idempotency/neighbor-idempotency.repository';
import { NeighborJobRepository } from './process-store/job/neighbor-job.repository';
import { NeighborProfileRepository } from './process-store/profile/neighbor-profile.repository';
import { NeighborPublishedIdRepository } from './process-store/published-id/neighbor-published-id.repository';
import { NeighborQuarantineRepository } from './process-store/quarantine/neighbor-quarantine.repository';
import { NeighborSyntheticMarkRepository } from './process-store/synthetic-mark/neighbor-synthetic-mark.repository';
import { NeighborTrainingInFlightRepository } from './process-store/training-in-flight/neighbor-training-in-flight.repository';
import { NeighborVersionLabelRepository } from './process-store/version-label/neighbor-version-label.repository';
import { NeighborHttp } from './shared/neighbor-http';
import { NeighborRpc } from './shared/neighbor-rpc';

const processStoreRepositories = [
  NeighborJobRepository,
  NeighborTrainingInFlightRepository,
  NeighborIdempotencyRepository,
  NeighborProfileRepository,
  NeighborEnumExtraRepository,
  NeighborVersionLabelRepository,
  NeighborActivationRepository,
  NeighborQuarantineRepository,
  NeighborSyntheticMarkRepository,
  NeighborPublishedIdRepository,
  NeighborDraftRepository,
  NeighborDocumentTypeRepository,
];

const indexRepositories = [
  NeighborCorpusSnapshotRepository,
  NeighborIndexMappingRepository,
  NeighborDocumentBatchRepository,
  NeighborIndexRefreshRepository,
  NeighborIndexSearchRepository,
  NeighborJobPurgeRepository,
  NeighborIndexHealthRepository,
];

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    NeighborHttp,
    NeighborRpc,
    NeighborIndexGateway,
    NeighborIndexPolicy,
    ...processStoreRepositories,
    ...indexRepositories,
    NeighborProcessStore,
    NeighborIndexHttpClient,
    LocalMockResourceAdapter,
    NeighborMockResourceAdapter,
    {
      provide: OPENSEARCH_INDEX_PORT,
      useExisting: NeighborIndexHttpClient,
    },
    {
      provide: PROCESS_STORE,
      useExisting: NeighborProcessStore,
    },
    {
      provide: MOCK_RESOURCE_PORT,
      useExisting: NeighborMockResourceAdapter,
    },
  ],
  exports: [OPENSEARCH_INDEX_PORT, PROCESS_STORE, MOCK_RESOURCE_PORT],
})
export class NeighborDataModule {}
