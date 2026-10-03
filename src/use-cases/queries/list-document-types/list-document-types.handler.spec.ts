import { ListDocumentTypesHandler } from './list-document-types.handler';
import { ListProfileVersionsHandler } from '../list-profile-versions/list-profile-versions.handler';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';

describe('ListDocumentTypesHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new ListDocumentTypesHandler(
    store,
    new ListProfileVersionsHandler(store),
  );

  beforeEach(async () => {
    inMemoryDatabase.documentTypes.clear();
    inMemoryDatabase.documentTypesSeeded = true;
    inMemoryDatabase.profileVersions.clear();
    await store.addDocumentType('document');
  });

  it('should_list_created_types_without_versions', async () => {
    const result = await handler.execute('test-stand');
    expect(result.items).toEqual([
      {
        documentType: 'document',
        versions: [],
        activeVersionId: null,
        activeVersionLabel: null,
      },
    ]);
  });
});
