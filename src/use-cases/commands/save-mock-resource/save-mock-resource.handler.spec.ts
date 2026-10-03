import { SaveMockResourceHandler } from './save-mock-resource.handler';
import type { MockResourcePort } from '@repositories/mock-resource.port';
import type { ProcessStore } from '@repositories/process-store.port';

const job = {
  jobId: 'job-1',
  kind: 'generate' as const,
  documentType: 'document',
  contour: 'test-stand',
  state: 'preview' as const,
  profileVersionId: 'v1',
  seed: 'seed',
  requestedCount: 1,
  publishedCount: 0,
  quarantineCount: 0,
  reason: null,
  createdAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  checkpointDocumentNumber: 0,
  targetIndex: 'documents-synthetic',
  generatedAt: '2026-01-01T00:00:00Z',
};

const catalogItem = {
  method: 'GET' as const,
  path: '/api/tasks',
  group: 'Tasks',
  summary: '',
  jobId: '',
  updatedAt: '2026-01-01',
  hasBody: false,
};

describe('SaveMockResourceHandler', () => {
  it('should_reject_empty_drafts_and_unknown_endpoint', async () => {
    const store = {
      getJob: jest.fn(async () => job),
      getDraftDocuments: jest.fn(async () => []),
    } as unknown as ProcessStore;
    const resources = {
      list: jest.fn(async () => [catalogItem]),
      putBody: jest.fn(),
    } as unknown as MockResourcePort;
    const handler = new SaveMockResourceHandler(store, resources);
    await expect(
      handler.execute({
        jobId: 'job-1',
        targets: [{ method: 'GET', path: '/api/tasks' }],
      }),
    ).rejects.toMatchObject({ status: 422 });
    store.getDraftDocuments = jest.fn(async () => [
      { id: 'd1', body: { took: 1 } },
    ]);
    await expect(
      handler.execute({
        jobId: 'job-1',
        targets: [{ method: 'GET', path: 'tasks' }],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      handler.execute({
        jobId: 'job-1',
        targets: [{ method: 'GET', path: '/api/other' }],
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(resources.putBody).not.toHaveBeenCalled();
  });

  it('should_put_single_body_or_array_to_catalog_targets', async () => {
    const store = {
      getJob: jest.fn(async () => job),
      getDraftDocuments: jest.fn(async () => [{ id: 'd1', body: { took: 1 } }]),
    } as unknown as ProcessStore;
    const resources = {
      list: jest.fn(async () => [catalogItem]),
      putBody: jest.fn(async (input) => ({
        method: input.method,
        path: input.path,
        sharePath: input.path,
      })),
    } as unknown as MockResourcePort;
    const handler = new SaveMockResourceHandler(store, resources);
    await expect(
      handler.execute({
        jobId: 'job-1',
        targets: [{ method: 'GET', path: '/api/tasks' }],
      }),
    ).resolves.toEqual({
      items: [{ method: 'GET', path: '/api/tasks', sharePath: '/api/tasks' }],
    });
    expect(resources.putBody).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/tasks',
      jobId: 'job-1',
      body: { took: 1 },
    });
    store.getDraftDocuments = jest.fn(async () => [
      { id: 'd1', body: { a: 1 } },
      { id: 'd2', body: { b: 2 } },
    ]);
    await handler.execute({
      jobId: 'job-1',
      targets: [{ method: 'GET', path: '/api/tasks' }],
    });
    expect(resources.putBody).toHaveBeenLastCalledWith({
      method: 'GET',
      path: '/api/tasks',
      jobId: 'job-1',
      body: [{ a: 1 }, { b: 2 }],
    });
  });
});
