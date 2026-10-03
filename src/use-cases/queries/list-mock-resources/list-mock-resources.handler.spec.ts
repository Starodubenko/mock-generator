import { ListMockResourcesHandler } from './list-mock-resources.handler';
import type { MockResourcePort } from '@repositories/mock-resource.port';

describe('ListMockResourcesHandler', () => {
  it('should_return_paths_without_bodies', async () => {
    const resources = {
      list: jest.fn(async () => [
        {
          method: 'GET',
          path: '/api/tasks',
          group: 'Tasks',
          summary: '',
          jobId: 'job-1',
          updatedAt: '2026-01-01',
          hasBody: false,
        },
      ]),
    } as unknown as MockResourcePort;
    await expect(
      new ListMockResourcesHandler(resources).execute(),
    ).resolves.toEqual([
      {
        method: 'GET',
        path: '/api/tasks',
        group: 'Tasks',
        summary: '',
        jobId: 'job-1',
        updatedAt: '2026-01-01',
        hasBody: false,
      },
    ]);
  });
});
