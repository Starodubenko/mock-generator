import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  normalizeMockGroup,
  normalizeMockHttpMethod,
  normalizeMockResourcePath,
} from '@entities/mock-resource/mock-resource-path';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
  type MockResourceMeta,
} from '@repositories/mock-resource.port';

export type UpsertMockEndpointCommand = {
  method: string;
  path: string;
  group: string;
  summary: string;
};

@Injectable()
export class UpsertMockEndpointHandler {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(command: UpsertMockEndpointCommand): Promise<MockResourceMeta> {
    const method = normalizeMockHttpMethod(command.method);
    const path = normalizeMockResourcePath(command.path);
    const group = normalizeMockGroup(command.group);
    if (!method || !path || !group) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Некорректный эндпоинт',
        '',
      );
    }
    const catalog = await this.resources.list();
    if (catalog.some((item) => item.method === method && item.path === path)) {
      throw new DomainHttpException(
        409,
        'mock_endpoint_exists',
        'Эндпоинт с таким методом и путём уже есть',
        '',
      );
    }
    return this.resources.upsertCatalog({
      method,
      path,
      group,
      summary: command.summary,
    });
  }
}
