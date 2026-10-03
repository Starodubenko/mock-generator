jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { NeighborMockResourceAdapter } from './neighbor-mock-resource.adapter';
import type { NeighborHttp } from '../shared/neighbor-http';

describe('NeighborMockResourceAdapter', () => {
  it('should_list_catalog_and_put_through_internal_port', async () => {
    const send = jest.fn();
    const http = {
      optionalBaseUrl: () => 'http://127.0.0.1:3100',
      send,
    } as unknown as NeighborHttp;
    const adapter = new NeighborMockResourceAdapter(http);
    send.mockResolvedValueOnce({
      status: 200,
      data: {
        resources: [
          {
            method: 'GET',
            path: '/api/tasks',
            group: 'Tasks',
            summary: 'Список',
            jobId: '',
            updatedAt: '2026-01-01',
            hasBody: false,
          },
        ],
      },
    });
    await expect(adapter.list()).resolves.toEqual([
      {
        method: 'GET',
        path: '/api/tasks',
        group: 'Tasks',
        summary: 'Список',
        jobId: '',
        updatedAt: '2026-01-01',
        hasBody: false,
      },
    ]);
    expect(send).toHaveBeenCalledWith('get', '/internal/v1/mock-resources', {
      caller: 'NeighborMockResourceAdapter',
    });
    send.mockResolvedValueOnce({
      status: 200,
      data: { path: '/api/tasks', method: 'GET', sharePath: '/api/tasks' },
    });
    await expect(
      adapter.putBody({
        path: '/api/tasks',
        method: 'GET',
        jobId: 'job-1',
        body: { took: 1 },
      }),
    ).resolves.toEqual({
      path: '/api/tasks',
      method: 'GET',
      sharePath: '/api/tasks',
    });
    expect(send).toHaveBeenCalledWith('put', '/internal/v1/mock-resources/body', {
      caller: 'NeighborMockResourceAdapter',
      data: {
        path: '/api/tasks',
        method: 'GET',
        jobId: 'job-1',
        body: { took: 1 },
      },
    });
  });

  it('should_get_public_path_without_wrapping_internal', async () => {
    const send = jest.fn().mockResolvedValue({ status: 200, data: { took: 1 } });
    const http = {
      optionalBaseUrl: () => 'http://127.0.0.1:3100',
      send,
    } as unknown as NeighborHttp;
    await expect(
      new NeighborMockResourceAdapter(http).get('/api/tasks', 'GET'),
    ).resolves.toEqual({ took: 1 });
    expect(send).toHaveBeenCalledWith('get', '/api/tasks', {
      caller: 'NeighborMockResourceAdapter',
    });
  });

  it('should_treat_public_404_as_missing', async () => {
    const send = jest.fn().mockResolvedValue({ status: 404, data: '' });
    const http = {
      optionalBaseUrl: () => 'http://127.0.0.1:3100',
      send,
    } as unknown as NeighborHttp;
    await expect(
      new NeighborMockResourceAdapter(http).get('/api/missing'),
    ).resolves.toBeUndefined();
  });
});
