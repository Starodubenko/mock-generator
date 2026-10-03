import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { normalizeMockGroup } from '@entities/mock-resource/mock-resource-path';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
} from '@repositories/mock-resource.port';

@Injectable()
export class AddMockGroupHandler {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(name: string): Promise<void> {
    const group = normalizeMockGroup(name);
    if (!group) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Некорректное имя группы',
        '',
      );
    }
    const existing = await this.resources.listGroups();
    if (existing.some((item) => item.toLowerCase() === group.toLowerCase())) {
      throw new DomainHttpException(
        409,
        'mock_group_exists',
        'Группа с таким именем уже есть',
        '',
      );
    }
    await this.resources.addGroup(group);
  }
}
