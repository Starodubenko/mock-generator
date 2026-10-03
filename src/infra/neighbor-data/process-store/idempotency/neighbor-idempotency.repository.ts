import { Injectable } from '@nestjs/common';
import type { IdempotencyRecord } from '@repositories/process-store.port';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborIdempotencyRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getIdempotency(key: string): Promise<IdempotencyRecord | undefined> {
    const result = await this.rpc.call<IdempotencyRecord | null>(
      'getIdempotency',
      { key },
    );
    return result ?? undefined;
  }

  async saveIdempotency(record: IdempotencyRecord): Promise<void> {
    await this.rpc.call('saveIdempotency', { record });
  }
}
