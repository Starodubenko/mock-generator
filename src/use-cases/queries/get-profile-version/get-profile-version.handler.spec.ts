import { GetProfileVersionHandler } from './get-profile-version.handler';
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
  ],
};

describe('GetProfileVersionHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new GetProfileVersionHandler(store);

  beforeEach(async () => {
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.enumExtrasByVersion.clear();
    await store.saveProfile(version);
  });

  it('should_return_merged_enum_domain_for_display', async () => {
    await store.addEnumExtra(
      'document',
      'test-stand',
      'v1',
      'messageType',
      'type-c',
    );
    const result = await handler.execute('document', 'test-stand', 'v1');
    expect(result.versionId).toBe('v1');
    expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(result.paths[0]?.categoryValues).toEqual([
      'type-a',
      'type-b',
      'type-c',
    ]);
  });
});
