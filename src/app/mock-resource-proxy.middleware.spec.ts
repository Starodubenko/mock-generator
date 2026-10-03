import { MockResourceProxyMiddleware } from './mock-resource-proxy.middleware';
import type { MockResourcePort } from '@repositories/mock-resource.port';

const asRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    end: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('MockResourceProxyMiddleware', () => {
  it('should_serve_stored_json_and_skip_console_paths', async () => {
    const resources = {
      get: jest.fn(async () => ({ took: 1 })),
    } as unknown as MockResourcePort;
    const middleware = new MockResourceProxyMiddleware(resources);
    const served = asRes();
    await middleware.use(
      { method: 'GET', path: '/api/tasks' } as never,
      served as never,
      jest.fn(),
    );
    expect(served.status).toHaveBeenCalledWith(200);
    expect(served.json).toHaveBeenCalledWith({ took: 1 });
    const next = jest.fn();
    await middleware.use(
      { method: 'GET', path: '/jobs/job-1' } as never,
      asRes() as never,
      next,
    );
    expect(next).toHaveBeenCalled();
    expect(resources.get).toHaveBeenCalledWith('/api/tasks', 'GET');
    expect(resources.get).toHaveBeenCalledTimes(1);
  });

  it('should_answer_404_when_path_is_free', async () => {
    const resources = {
      get: jest.fn(async () => undefined),
    } as unknown as MockResourcePort;
    const middleware = new MockResourceProxyMiddleware(resources);
    const res = asRes();
    await middleware.use(
      { method: 'GET', path: '/api/tasks' } as never,
      res as never,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).not.toHaveBeenCalled();
  });
});
