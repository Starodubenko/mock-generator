import { Injectable } from '@nestjs/common';
import type { QuarantineItem } from '@repositories/process-store.port';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborQuarantineRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getQuarantine(jobId: string): Promise<QuarantineItem[]> {
    return this.rpc.call('getQuarantine', { jobId });
  }

  async appendQuarantine(
    jobId: string,
    items: QuarantineItem[],
  ): Promise<void> {
    await this.rpc.call('appendQuarantine', { jobId, items });
  }
}
