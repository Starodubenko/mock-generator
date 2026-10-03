import { Injectable } from '@nestjs/common';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborVersionLabelRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<string | undefined> {
    const result = await this.rpc.call<string | null>('getVersionLabel', {
      documentType,
      contour,
      versionId,
    });
    return result ?? undefined;
  }

  async setVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
    label: string,
  ): Promise<void> {
    await this.rpc.call('setVersionLabel', {
      documentType,
      contour,
      versionId,
      label,
    });
  }
}
