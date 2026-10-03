import { AddProfileEnumValueHandler } from './add-profile-enum-value.handler';
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
  paths: [
    {
      path: 'messageType',
      pathClass: 'category',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 2,
      missingKeyRate: 0,
      categoryValues: ['type-a', 'type-b'],
    },
    {
      path: 'amount',
      pathClass: 'number-string',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    },
  ],
};

describe('AddProfileEnumValueHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new AddProfileEnumValueHandler(store);

  beforeEach(async () => {
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.enumExtrasByVersion.clear();
    await store.saveProfile(version);
  });

  it('should_add_value_without_rewriting_trained_snapshot', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      path: 'messageType',
      value: '  type-c  ',
    });
    expect(result.value).toBe('type-c');
    expect(
      (await store.getProfile('document', 'test-stand', 'v1'))?.paths[0]
        ?.categoryValues,
    ).toEqual(['type-a', 'type-b']);
    expect(
      await store.getEnumExtras('document', 'test-stand', 'v1'),
    ).toEqual({
      messageType: ['type-c'],
    });
  });

  it('should_be_idempotent_when_value_already_exists', async () => {
    await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      path: 'messageType',
      value: 'type-a',
    });
    expect(
      await store.getEnumExtras('document', 'test-stand', 'v1'),
    ).toEqual({});
  });

  it('should_reject_non_category_path', async () => {
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        versionId: 'v1',
        path: 'amount',
        value: 'x',
      }),
    ).rejects.toThrow(DomainHttpException);
  });

  it('should_reject_blank_value', async () => {
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        versionId: 'v1',
        path: 'messageType',
        value: '   ',
      }),
    ).rejects.toThrow(DomainHttpException);
  });
});
