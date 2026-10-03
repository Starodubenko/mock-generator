import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Client } from '@opensearch-project/opensearch';
import type { NextFunction, Request, Response } from 'express';
import { ServiceAuthGuard } from './auth/service-auth.guard';
import { loadIndexerConfig } from './config';
import { HealthController } from './health/health.controller';
import { IndexesController } from './indexes/indexes.controller';
import { IndexesService } from './indexes/indexes.service';
import { ClusterPort } from './opensearch/cluster.port';
import { JobDocStore } from './opensearch/job-doc-store';
import { MemoryCluster } from './opensearch/memory-cluster';
import { OpenSearchCluster } from './opensearch/opensearch-cluster';
import { seedReferenceIndex } from './seed/seed-reference';
import {
  createProcessPrisma,
  PostgresProcessStore,
} from './process-store/postgres-process.store';
import { ProcessStoreController } from './process-store/process-store.controller';
import { MockResourcePublicController } from './mock-resources/mock-resource-public.controller';
import { MockResourcePublicMiddleware } from './mock-resources/mock-resource-public.middleware';
import { MockResourcesController } from './mock-resources/mock-resources.controller';
import { MockResourcesService } from './mock-resources/mock-resources.service';
import { SnapshotsController } from './snapshots/snapshots.controller';
import { SnapshotsService } from './snapshots/snapshots.service';

const clusterFactory = (): ClusterPort => {
  const config = loadIndexerConfig();
  if (config.opensearchNode === 'memory') {
    return new MemoryCluster();
  }
  return new OpenSearchCluster(
    new Client({
      node: config.opensearchNode,
      ssl: { rejectUnauthorized: false },
    }),
  );
};

@Module({
  controllers: [
    HealthController,
    IndexesController,
    SnapshotsController,
    ProcessStoreController,
    MockResourcesController,
    MockResourcePublicController,
  ],
  providers: [
    ServiceAuthGuard,
    IndexesService,
    SnapshotsService,
    JobDocStore,
    MockResourcesService,
    MockResourcePublicMiddleware,
    { provide: ClusterPort, useFactory: clusterFactory },
    {
      provide: PostgresProcessStore,
      useFactory: async () => {
        const config = loadIndexerConfig();
        const store = new PostgresProcessStore(
          createProcessPrisma(config),
          config,
        );
        await store.init();
        return store;
      },
    },
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(ClusterPort) private readonly cluster: ClusterPort,
    private readonly store: PostgresProcessStore,
    private readonly adapterHost: HttpAdapterHost,
    private readonly mockResources: MockResourcePublicMiddleware,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.store.close();
  }

  async onModuleInit(): Promise<void> {
    this.adapterHost.httpAdapter
      .getInstance()
      .use((req: Request, res: Response, next: NextFunction) => {
        void this.mockResources.use(req, res, next);
      });
    const config = loadIndexerConfig();
    if (!config.seedReferencePath) {
      return;
    }
    try {
      await seedReferenceIndex(
        this.cluster,
        config.seedReferenceIndex,
        config.seedReferencePath,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'seed_failed';
      process.stderr.write(`test-indexer seed skipped: ${message}\n`);
    }
  }
}
