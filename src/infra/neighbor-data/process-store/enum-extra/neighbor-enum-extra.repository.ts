import { Injectable } from '@nestjs/common';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborEnumExtraRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getEnumExtras(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<Record<string, string[]>> {
    return this.rpc.call('getEnumExtras', { documentType, contour, versionId });
  }

  async addEnumExtra(
    documentType: string,
    contour: string,
    versionId: string,
    path: string,
    value: string,
  ): Promise<void> {
    await this.rpc.call('addEnumExtra', {
      documentType,
      contour,
      versionId,
      path,
      value,
    });
  }
}
