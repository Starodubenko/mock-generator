import { Injectable } from '@nestjs/common';
import type { DraftDocument } from '@repositories/process-store.port';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborDraftRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async saveDraftDocuments(
    jobId: string,
    documents: DraftDocument[],
  ): Promise<void> {
    await this.rpc.call('saveDraftDocuments', { jobId, documents });
  }

  async getDraftDocuments(jobId: string): Promise<DraftDocument[]> {
    return this.rpc.call('getDraftDocuments', { jobId });
  }
}
