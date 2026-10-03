import { Injectable } from '@nestjs/common';
import type { ProfileVersion } from '@entities/profile/profile.types';
import { NeighborRpc } from '../../shared/neighbor-rpc';
import { profileFromWire, profileToWire } from '../../shared/profile-wire';

@Injectable()
export class NeighborProfileRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<ProfileVersion | undefined> {
    return profileFromWire(
      await this.rpc.call('getProfile', { documentType, contour, versionId }),
    );
  }

  async saveProfile(version: ProfileVersion): Promise<void> {
    await this.rpc.call('saveProfile', { version: profileToWire(version) });
  }

  async listProfiles(
    documentType: string,
    contour: string,
  ): Promise<ProfileVersion[]> {
    const result = await this.rpc.call<unknown[]>('listProfiles', {
      documentType,
      contour,
    });
    return result.flatMap((item) => {
      const version = profileFromWire(item);
      return version ? [version] : [];
    });
  }

  async deleteProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void> {
    await this.rpc.call('deleteProfile', { documentType, contour, versionId });
  }
}
