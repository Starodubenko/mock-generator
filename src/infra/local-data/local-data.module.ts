import { Global, Module } from '@nestjs/common';
import { OPENSEARCH_INDEX_PORT } from '@repositories/opensearch-index.port';
import { PROCESS_STORE } from '@repositories/process-store.port';
import { MOCK_RESOURCE_PORT } from '@repositories/mock-resource.port';
import { LocalOpenSearchIndexAdapter } from './local-opensearch-index.adapter';
import { InMemoryProcessStore } from './in-memory-process.store';
import { LocalMockResourceAdapter } from './local-mock-resource.adapter';

@Global()
@Module({
  providers: [
    LocalOpenSearchIndexAdapter,
    InMemoryProcessStore,
    LocalMockResourceAdapter,
    {
      provide: OPENSEARCH_INDEX_PORT,
      useExisting: LocalOpenSearchIndexAdapter,
    },
    {
      provide: PROCESS_STORE,
      useExisting: InMemoryProcessStore,
    },
    {
      provide: MOCK_RESOURCE_PORT,
      useExisting: LocalMockResourceAdapter,
    },
  ],
  exports: [
    OPENSEARCH_INDEX_PORT,
    LocalOpenSearchIndexAdapter,
    PROCESS_STORE,
    MOCK_RESOURCE_PORT,
  ],
})
export class LocalDataModule {}
