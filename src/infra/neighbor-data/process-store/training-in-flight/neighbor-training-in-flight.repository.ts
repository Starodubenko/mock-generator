import { Injectable } from '@nestjs/common';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborTrainingInFlightRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async hasTrainingInFlight(key: string): Promise<boolean> {
    return this.rpc.call<boolean>('hasTrainingInFlight', { key });
  }

  async setTrainingInFlight(key: string, jobId: string): Promise<void> {
    await this.rpc.call('setTrainingInFlight', { key, jobId });
  }

  async clearTrainingInFlight(key: string): Promise<void> {
    await this.rpc.call('clearTrainingInFlight', { key });
  }
}
