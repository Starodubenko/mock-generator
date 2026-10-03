import { Injectable } from '@nestjs/common';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborPublishedIdRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async appendPublishedIds(jobId: string, ids: string[]): Promise<void> {
    await this.rpc.call('appendPublishedIds', { jobId, ids });
  }

  async getPublishedIds(jobId: string): Promise<string[]> {
    return this.rpc.call('getPublishedIds', { jobId });
  }
}
