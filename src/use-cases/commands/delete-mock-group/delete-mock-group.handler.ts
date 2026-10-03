import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { normalizeMockGroup } from '@entities/mock-resource/mock-resource-path';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
} from '@repositories/mock-resource.port';

@Injectable()
export class DeleteMockGroupHandler {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(name: string): Promise<void> {
    if (!normalizeMockGroup(name)) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Некорректное имя группы',
        '',
      );
    }
    await this.resources.removeGroup(name);
  }
}
