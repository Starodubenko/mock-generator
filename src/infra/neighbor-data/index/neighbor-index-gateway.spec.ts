jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { NeighborHttp } from '../shared/neighbor-http';
import { NeighborIndexGateway } from './neighbor-index-gateway';

describe('NeighborIndexGateway', () => {
  const previousUrl = process.env.INDEXER_BASE_URL;

  afterEach(() => {
    process.env.INDEXER_BASE_URL = previousUrl;
  });

  it('should_call_remote_when_indexer_url_set', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    const gateway = new NeighborIndexGateway({
      optionalBaseUrl: () => 'http://indexer.test',
    } as NeighborHttp);
    const remote = jest.fn().mockResolvedValue('remote');
    const local = jest.fn();
    await expect(gateway.orFallback(local, remote)).resolves.toBe('remote');
    expect(local).not.toHaveBeenCalled();
  });

  it('should_call_fallback_when_indexer_url_unset', async () => {
    delete process.env.INDEXER_BASE_URL;
    const fallback = { openSnapshot: jest.fn() };
    const gateway = new NeighborIndexGateway(
      { optionalBaseUrl: () => '' } as NeighborHttp,
      fallback as never,
    );
    await expect(
      gateway.orFallback(
        (adapter) => {
          expect(adapter).toBe(fallback);
          return 'local';
        },
        () => Promise.resolve('remote'),
      ),
    ).resolves.toBe('local');
  });

  it('should_throw_when_url_and_fallback_missing', async () => {
    const gateway = new NeighborIndexGateway({
      optionalBaseUrl: () => '',
    } as NeighborHttp);
    await expect(
      gateway.orFallback(
        () => Promise.resolve('local'),
        () => Promise.resolve('remote'),
      ),
    ).rejects.toThrow(
      'INDEXER_BASE_URL is required for NeighborIndexHttpClient',
    );
  });
});
