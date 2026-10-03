jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { of } from 'rxjs';
import { NeighborHttp } from './neighbor-http';

describe('NeighborHttp', () => {
  const previousUrl = process.env.INDEXER_BASE_URL;
  const previousToken = process.env.PLATFORM_SERVICE_TOKEN;

  afterEach(() => {
    process.env.INDEXER_BASE_URL = previousUrl;
    process.env.PLATFORM_SERVICE_TOKEN = previousToken;
  });

  it('should_require_indexer_url', async () => {
    delete process.env.INDEXER_BASE_URL;
    const http = new NeighborHttp({ post: jest.fn() } as never);
    await expect(
      http.send('post', '/internal/v1/health', {
        caller: 'NeighborProcessStore',
      }),
    ).rejects.toThrow('INDEXER_BASE_URL is required for NeighborProcessStore');
  });

  it('should_send_service_and_idempotency_headers', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    process.env.PLATFORM_SERVICE_TOKEN = 'token';
    const post = jest
      .fn()
      .mockReturnValue(of({ status: 200, data: { ok: true } }));
    const http = new NeighborHttp({ post } as never);
    await expect(
      http.send('post', '/internal/v1/process-store', {
        caller: 'NeighborProcessStore',
        data: { op: 'getJob' },
        jobId: 'job-9',
        batchNo: 1,
      }),
    ).resolves.toEqual({ status: 200, data: { ok: true } });
    const call = post.mock.calls[0] as unknown as [
      string,
      unknown,
      { headers: Record<string, string> },
    ];
    expect(call[0]).toBe('http://indexer.test/internal/v1/process-store');
    expect(call[2].headers).toEqual({
      'X-Service-Name': 'synthetic-data-generator',
      Authorization: 'Bearer token',
      'Idempotency-Key': 'job-9:1',
    });
  });
});
