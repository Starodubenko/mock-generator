import { Injectable } from '@nestjs/common';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborSyntheticMarkRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async markSyntheticIndex(index: string): Promise<void> {
    await this.rpc.call('markSyntheticIndex', { index });
  }

  async markSyntheticSource(sourceIndex: string): Promise<void> {
    await this.rpc.call('markSyntheticSource', { sourceIndex });
  }
}
