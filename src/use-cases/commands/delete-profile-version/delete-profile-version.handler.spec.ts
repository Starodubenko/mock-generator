import { DeleteProfileVersionHandler } from './delete-profile-version.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type { ProfileVersion } from '@entities/profile/profile.types';

const version = (versionId: string): ProfileVersion => ({
  versionId,
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
});

describe('DeleteProfileVersionHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new DeleteProfileVersionHandler(store);

  beforeEach(async () => {
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.versionLabels.clear();
    inMemoryDatabase.enumExtrasByVersion.clear();
    inMemoryDatabase.activeVersionByContour.clear();
    await store.saveProfile(version('old'));
    await store.saveProfile(version('live'));
    await store.setActiveVersionId('document', 'test-stand', 'live');
    await store.setVersionLabel('document', 'test-stand', 'old', 'черновик');
  });

  it('should_delete_inactive_version_and_its_label', async () => {
    await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'old',
    });
    expect(
      await store.getProfile('document', 'test-stand', 'old'),
    ).toBeUndefined();
    expect(
      await store.getVersionLabel('document', 'test-stand', 'old'),
    ).toBeUndefined();
    expect(
      await store.getProfile('document', 'test-stand', 'live'),
    ).toBeDefined();
  });

  it('should_refuse_deleting_active_version', async () => {
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        versionId: 'live',
      }),
    ).rejects.toThrow(DomainHttpException);
    expect(
      await store.getProfile('document', 'test-stand', 'live'),
    ).toBeDefined();
  });
});
