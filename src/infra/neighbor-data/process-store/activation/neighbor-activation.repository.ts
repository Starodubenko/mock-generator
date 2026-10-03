import { Injectable } from '@nestjs/common';
import type { ActivationRecord } from '@repositories/process-store.port';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborActivationRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getActiveVersionId(
    documentType: string,
    contour: string,
  ): Promise<string | undefined> {
    const result = await this.rpc.call<string | null>('getActiveVersionId', {
      documentType,
      contour,
    });
    return result ?? undefined;
  }

  async setActiveVersionId(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void> {
    await this.rpc.call('setActiveVersionId', {
      documentType,
      contour,
      versionId,
    });
  }

  async appendActivation(record: ActivationRecord): Promise<void> {
    await this.rpc.call('appendActivation', { record });
  }

  async wasActivated(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<boolean> {
    return this.rpc.call<boolean>('wasActivated', {
      documentType,
      contour,
      versionId,
    });
  }
}
