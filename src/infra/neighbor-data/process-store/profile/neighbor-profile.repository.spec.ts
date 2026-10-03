import type { ProfileVersion } from '@entities/profile/profile.types';
import { createRpcDouble } from '../rpc-double';
import { NeighborProfileRepository } from './neighbor-profile.repository';

const version: ProfileVersion = {
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  paths: [],
  aliases: [],
  corpusValueFingerprints: new Set(['aa']),
  sampleDocumentCount: 1,
  activatable: true,
};

describe('NeighborProfileRepository', () => {
  it('should_rebuild_fingerprint_set_and_skip_invalid_rows', async () => {
    const { rpc, call } = createRpcDouble();
    call
      .mockResolvedValueOnce({
        ...version,
        corpusValueFingerprints: ['aa'],
      })
      .mockResolvedValueOnce([
        { ...version, corpusValueFingerprints: ['aa'] },
        { contour: 'test-stand' },
      ]);
    const repository = new NeighborProfileRepository(rpc);
    const profile = await repository.getProfile(
      'document',
      'test-stand',
      'v1',
    );
    expect(profile?.corpusValueFingerprints).toEqual(new Set(['aa']));
    await expect(
      repository.listProfiles('document', 'test-stand'),
    ).resolves.toHaveLength(1);
    expect(call).toHaveBeenNthCalledWith(1, 'getProfile', {
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
    });
  });

  it('should_send_fingerprints_as_array', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(undefined);
    const repository = new NeighborProfileRepository(rpc);
    await repository.saveProfile(version);
    await repository.deleteProfile('document', 'test-stand', 'v1');
    expect(call).toHaveBeenNthCalledWith(1, 'saveProfile', {
      version: { ...version, corpusValueFingerprints: ['aa'] },
    });
    expect(call).toHaveBeenNthCalledWith(2, 'deleteProfile', {
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
    });
  });
});
