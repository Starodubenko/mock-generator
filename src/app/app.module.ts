import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { RenderModule } from '@nestjs-ssr/react';
import type { NextFunction, Request, Response } from 'express';
import { LocalDataModule } from '@infra/local-data/local-data.module';
import { NeighborDataModule } from '@infra/neighbor-data/neighbor-data.module';
import { ConsoleLiveModule } from '@infra/console-live/console-live.module';
import { RestApiModule } from '@api/rest/rest-api.module';
import { ConsoleModule } from '@api/console/console.module';
import { UseCasesModule } from '@use-cases/use-cases.module';
import { ListDocumentTypesHandler } from '@use-cases/queries/list-document-types/list-document-types.handler';
import { createConsoleSsrContext } from './console-ssr-context';
import { MockResourceProxyMiddleware } from './mock-resource-proxy.middleware';

const dataModule = process.env.INDEXER_BASE_URL
  ? NeighborDataModule
  : LocalDataModule;

@Module({
  imports: [
    ConsoleLiveModule,
    dataModule,
    UseCasesModule,
    RenderModule.forRootAsync({
      imports: [UseCasesModule],
      inject: [ListDocumentTypesHandler],
      useFactory: (listTypes: ListDocumentTypesHandler) => ({
        mode: 'string',
        clientNavigation: true,
        context: createConsoleSsrContext(listTypes),
      }),
    }),
    RestApiModule,
    ConsoleModule,
  ],
  providers: [MockResourceProxyMiddleware],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly mockResourceProxy: MockResourceProxyMiddleware,
  ) {}

  onModuleInit(): void {
    this.adapterHost.httpAdapter
      .getInstance()
      .use((req: Request, res: Response, next: NextFunction) => {
        void this.mockResourceProxy.use(req, res, next);
      });
  }
}
