import { ListProfileVersionsHandler } from './list-profile-versions.handler';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type { ProfileVersion } from '@entities/profile/profile.types';

const version = (input: {
  versionId: string;
  createdAt: string;
}): ProfileVersion => ({
  versionId: input.versionId,
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: input.createdAt,
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths: [],
});

describe('ListProfileVersionsHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new ListProfileVersionsHandler(store);

  beforeEach(() => {
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.versionLabels.clear();
    inMemoryDatabase.activeVersionByContour.clear();
  });

  it('should_return_versions_newest_first', async () => {
    await store.saveProfile(
      version({ versionId: 'old', createdAt: '2026-01-01T00:00:00Z' }),
    );
    await store.saveProfile(
      version({ versionId: 'new', createdAt: '2026-09-27T10:00:00Z' }),
    );
    const result = await handler.execute('document', 'test-stand');
    expect(result.items.map((item) => item.versionId)).toEqual(['new', 'old']);
    expect(result.items[0]?.createdAt).toBe('2026-09-27T10:00:00Z');
  });
});
