import { Inject, Injectable } from '@nestjs/common';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
} from '@repositories/mock-resource.port';

@Injectable()
export class ListMockGroupsHandler {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async execute(): Promise<string[]> {
    return this.resources.listGroups();
  }
}
