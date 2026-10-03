import { LocalMockResourceAdapter } from './local-mock-resource.adapter';
import { inMemoryDatabase } from './in-memory-database';

describe('LocalMockResourceAdapter', () => {
  beforeEach(() => {
    inMemoryDatabase.mockResources.clear();
    inMemoryDatabase.mockGroups.clear();
  });

  it('should_keep_catalog_without_body_and_bind_later', async () => {
    const adapter = new LocalMockResourceAdapter();
    await adapter.addGroup('Tasks');
    await adapter.upsertCatalog({
      method: 'GET',
      path: '/api/tasks',
      group: 'Tasks',
      summary: 'Список задач',
    });
    expect(await adapter.listGroups()).toEqual(['Tasks']);
    expect(await adapter.list()).toEqual([
      expect.objectContaining({
        path: '/api/tasks',
        method: 'GET',
        group: 'Tasks',
        hasBody: false,
      }),
    ]);
    expect(await adapter.get('/api/tasks', 'GET')).toBeUndefined();
    await adapter.putBody({
      method: 'GET',
      path: '/api/tasks',
      jobId: 'job-1',
      body: { took: 1 },
    });
    expect(await adapter.get('/api/tasks', 'GET')).toEqual({ took: 1 });
    expect((await adapter.list())[0]?.hasBody).toBe(true);
  });
});
