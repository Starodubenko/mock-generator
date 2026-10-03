import { Inject, Injectable } from '@nestjs/common';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
  type MockResourceMeta,
} from '@repositories/mock-resource.port';

@Injectable()
export class ListMockResourcesHandler {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(): Promise<MockResourceMeta[]> {
    return this.resources.list();
  }
};
