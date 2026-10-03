import { Injectable } from '@nestjs/common';
import type { DocumentTypeRecord } from '@repositories/process-store.port';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborDocumentTypeRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async listDocumentTypes(): Promise<DocumentTypeRecord[]> {
    return this.rpc.call('listDocumentTypes');
  }

  async hasDocumentType(documentType: string): Promise<boolean> {
    return this.rpc.call('hasDocumentType', { documentType });
  }

  async addDocumentType(documentType: string): Promise<void> {
    await this.rpc.call('addDocumentType', { documentType });
  }

  async deleteDocumentType(documentType: string): Promise<void> {
    await this.rpc.call('deleteDocumentType', { documentType });
  }
}
