import { SetProfileVersionLabelHandler } from './set-profile-version-label.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type { ProfileVersion } from '@entities/profile/profile.types';

const version: ProfileVersion = {
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths: [],
};

describe('SetProfileVersionLabelHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new SetProfileVersionLabelHandler(store);

  beforeEach(async () => {
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.versionLabels.clear();
    await store.saveProfile(version);
  });

  it('should_store_trimmed_label_without_changing_version_id', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      label: '  стенд сентябрь  ',
    });
    expect(result).toEqual({ versionId: 'v1', label: 'стенд сентябрь' });
    expect(
      (await store.getProfile('document', 'test-stand', 'v1'))?.versionId,
    ).toBe('v1');
    expect(await store.getVersionLabel('document', 'test-stand', 'v1')).toBe(
      'стенд сентябрь',
    );
  });

  it('should_reject_empty_label', async () => {
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        versionId: 'v1',
        label: '   ',
      }),
    ).rejects.toThrow(DomainHttpException);
  });
});
