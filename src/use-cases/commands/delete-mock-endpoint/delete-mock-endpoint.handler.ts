import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  normalizeMockHttpMethod,
  normalizeMockResourcePath,
} from '@entities/mock-resource/mock-resource-path';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
} from '@repositories/mock-resource.port';

@Injectable()
export class DeleteMockEndpointHandler {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(method: string, path: string): Promise<void> {
    if (!normalizeMockHttpMethod(method) || !normalizeMockResourcePath(path)) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Некорректный эндпоинт',
        '',
      );
    }
    await this.resources.remove(method, path);
  }
}
