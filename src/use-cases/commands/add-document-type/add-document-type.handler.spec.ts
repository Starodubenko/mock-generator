import { AddDocumentTypeHandler } from './add-document-type.handler';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import { DomainHttpException } from '@app/domain-http.exception';

describe('AddDocumentTypeHandler', () => {
  const store = new InMemoryProcessStore();
  const handler = new AddDocumentTypeHandler(store);

  beforeEach(() => {
    inMemoryDatabase.documentTypes.clear();
    inMemoryDatabase.documentTypesSeeded = true;
  });

  it('should_add_a_new_slug', async () => {
    expect(await handler.execute({ documentType: ' Example-Type ' })).toEqual({
      documentType: 'example-type',
    });
    expect(await store.hasDocumentType('example-type')).toBe(true);
  });

  it('should_reject_duplicate_and_bad_slug', async () => {
    await handler.execute({ documentType: 'related' });
    await expect(
      handler.execute({ documentType: 'related' }),
    ).rejects.toThrow(DomainHttpException);
    await expect(handler.execute({ documentType: 'Bad Type' })).rejects.toThrow(
      DomainHttpException,
    );
  });
});
