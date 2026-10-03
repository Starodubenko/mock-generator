import { DeleteDocumentTypeHandler } from './delete-document-type.handler';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import { DomainHttpException } from '@app/domain-http.exception';
import type { ProfileVersion } from '@entities/profile/profile.types';

const version = (documentType: string): ProfileVersion => ({
  versionId: 'v1',
  documentType,
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

describe('DeleteDocumentTypeHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new DeleteDocumentTypeHandler(store);

  beforeEach(async () => {
    inMemoryDatabase.documentTypes.clear();
    inMemoryDatabase.documentTypesSeeded = true;
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.activeVersionByContour.clear();
    inMemoryDatabase.versionLabels.clear();
    await store.addDocumentType('document');
    await store.saveProfile(version('document'));
    await store.setActiveVersionId('document', 'test-stand', 'v1');
    await store.setVersionLabel('document', 'test-stand', 'v1', 'стенд');
  });

  it('should_remove_type_and_all_its_profiles', async () => {
    expect(await handler.execute({ documentType: 'document' })).toEqual({
      documentType: 'document',
    });
    expect(await store.hasDocumentType('document')).toBe(false);
    expect(await store.listProfiles('document', 'test-stand')).toHaveLength(
      0,
    );
    expect(
      await store.getActiveVersionId('document', 'test-stand'),
    ).toBeUndefined();
  });

  it('should_reject_unknown_type', async () => {
    await expect(handler.execute({ documentType: 'missing' })).rejects.toThrow(
      DomainHttpException,
    );
  });
});
