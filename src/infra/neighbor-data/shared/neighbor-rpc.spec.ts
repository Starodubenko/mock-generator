jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { of } from 'rxjs';
import { NeighborHttp } from './neighbor-http';
import { NeighborRpc } from './neighbor-rpc';

describe('NeighborRpc', () => {
  const previousUrl = process.env.INDEXER_BASE_URL;

  afterEach(() => {
    process.env.INDEXER_BASE_URL = previousUrl;
  });

  it('should_post_op_and_return_result', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    const post = jest.fn().mockReturnValue(
      of({
        status: 200,
        data: { result: { versionId: 'v1' } },
      }),
    );
    const rpc = new NeighborRpc(new NeighborHttp({ post } as never));
    await expect(rpc.call('getProfile', { versionId: 'v1' })).resolves.toEqual({
      versionId: 'v1',
    });
    const firstCall = post.mock.calls[0] as unknown as [
      string,
      { op: string; args: Record<string, string> },
      { headers: Record<string, string> },
    ];
    expect(firstCall[0]).toBe('http://indexer.test/internal/v1/process-store');
    expect(firstCall[1]).toEqual({
      op: 'getProfile',
      args: { versionId: 'v1' },
    });
    expect(firstCall[2].headers['X-Service-Name']).toBe(
      'synthetic-data-generator',
    );
  });

  it('should_throw_on_neighbor_4xx', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    const post = jest
      .fn()
      .mockReturnValue(of({ status: 400, data: { error: 'bad' } }));
    const rpc = new NeighborRpc(new NeighborHttp({ post } as never));
    await expect(rpc.call('getJob', { jobId: 'j1' })).rejects.toMatchObject({
      message: 'process_store_400',
      status: 400,
    });
  });
});
