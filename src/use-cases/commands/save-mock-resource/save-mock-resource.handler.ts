import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  normalizeMockHttpMethod,
  normalizeMockResourcePath,
} from '@entities/mock-resource/mock-resource-path';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
  type MockResourcePutResult,
} from '@repositories/mock-resource.port';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type SaveMockResourceCommand = {
  jobId: string;
  targets: Array<{ method: string; path: string }>;
};

@Injectable()
export class SaveMockResourceHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(
    command: SaveMockResourceCommand,
  ): Promise<{ items: MockResourcePutResult[] }> {
    const job = await this.store.getJob(command.jobId);
    if (!job) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Задание не найдено',
        '',
      );
    }
    const drafts = await this.store.getDraftDocuments(command.jobId);
    if (drafts.length === 0) {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Нет черновика для ресурса',
        '',
      );
    }
    if (command.targets.length === 0) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Выберите эндпоинт',
        '',
      );
    }
    const catalog = await this.resources.list();
    const body =
      drafts.length === 1 ? drafts[0]?.body : drafts.map((item) => item.body);
    const items: MockResourcePutResult[] = [];
    for (const target of command.targets) {
      const method = normalizeMockHttpMethod(target.method);
      const path = normalizeMockResourcePath(target.path);
      if (!method || !path) {
        throw new DomainHttpException(
          400,
          'validation_error',
          'Некорректный путь ресурса',
          '',
        );
      }
      const exists = catalog.some(
        (item) => item.method === method && item.path === path,
      );
      if (!exists) {
        throw new DomainHttpException(
          400,
          'validation_error',
          'Сначала добавьте эндпоинт на вкладке Моки',
          '',
        );
      }
      items.push(
        await this.resources.putBody({
          method,
          path,
          jobId: command.jobId,
          body,
        }),
      );
    }
    return { items };
  }
}
