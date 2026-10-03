import { UpsertMockEndpointHandler } from './upsert-mock-endpoint.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import type { MockResourcePort } from '@repositories/mock-resource.port';

describe('UpsertMockEndpointHandler', () => {
  it('should_reject_invalid_catalog_and_upsert_valid', async () => {
    const resources = {
      list: jest.fn(async () => []),
      upsertCatalog: jest.fn(async (input) => ({
        ...input,
        method: 'GET',
        jobId: '',
        updatedAt: 't',
        hasBody: false,
      })),
    } as unknown as MockResourcePort;
    const handler = new UpsertMockEndpointHandler(resources);
    await expect(
      handler.execute({
        method: 'GET',
        path: 'tasks',
        group: 'Tasks',
        summary: '',
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      handler.execute({
        method: 'GET',
        path: '/api/tasks',
        group: 'Tasks',
        summary: 'Список',
      }),
    ).resolves.toMatchObject({ path: '/api/tasks', group: 'Tasks' });
  });

  it('should_reject_existing_method_and_path', async () => {
    const resources = {
      list: jest.fn(async () => [
        {
          method: 'GET',
          path: '/api/orders',
          group: 'Orders',
          summary: '',
          jobId: '',
          updatedAt: 't',
          hasBody: false,
        },
      ]),
      upsertCatalog: jest.fn(),
    } as unknown as MockResourcePort;
    const handler = new UpsertMockEndpointHandler(resources);
    await expect(
      handler.execute({
        method: 'GET',
        path: '/api/orders',
        group: 'Orders',
        summary: '',
      }),
    ).rejects.toThrow(DomainHttpException);
    try {
      await handler.execute({
        method: 'get',
        path: '/api/orders',
        group: 'Orders',
        summary: '',
      });
    } catch (error) {
      expect((error as DomainHttpException).getResponse()).toMatchObject({
        reason: 'mock_endpoint_exists',
      });
    }
    expect(resources.upsertCatalog).not.toHaveBeenCalled();
  });
});
