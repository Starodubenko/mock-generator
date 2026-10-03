jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { of } from 'rxjs';
import { createNeighborIndexHttpClient } from './neighbor-index-http.client';
import { LocalOpenSearchIndexAdapter } from '../../local-data/local-opensearch-index.adapter';
import { inMemoryDatabase } from '../../local-data/in-memory-database';

describe('NeighborIndexHttpClient', () => {
  const fallback = new LocalOpenSearchIndexAdapter();
  const http = {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
  };
  const client = createNeighborIndexHttpClient(http as never, fallback);
  const originalIndexerUrl = process.env.INDEXER_BASE_URL;

  beforeEach(() => {
    delete process.env.INDEXER_BASE_URL;
    inMemoryDatabase.syntheticSources.clear();
    http.post.mockReset();
    http.put.mockReset();
  });

  afterAll(() => {
    if (originalIndexerUrl === undefined) {
      delete process.env.INDEXER_BASE_URL;
    } else {
      process.env.INDEXER_BASE_URL = originalIndexerUrl;
    }
  });

  it('should_delegate_to_local_adapter_when_indexer_url_unset', async () => {
    inMemoryDatabase.syntheticSources.add('filled-by-generator');
    await expect(
      client.openSnapshot({
        contour: 'test-stand',
        sourceIndex: 'filled-by-generator',
        sampleSize: 10,
      }),
    ).rejects.toMatchObject({ message: 'source_is_synthetic' });
    expect(http.post).not.toHaveBeenCalled();
  });

  it('should_call_neighbor_canary_with_idempotency_header', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    http.put.mockReturnValue(
      of({ status: 200, data: { accepted: ['d1'], rejected: [] } }),
    );
    await client.upsertBatch({
      contour: 'test-stand',
      index: 'documents-synthetic',
      jobId: 'job-9',
      batchNo: 1,
      mode: 'canary',
      documents: [{ id: 'd1', body: { status: 'NEW' } }],
    });
    const putCall = http.put.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
      {
        headers: Record<string, string>;
        validateStatus: (status: number) => boolean;
      },
    ];
    expect(putCall[0]).toBe(
      'http://indexer.test/internal/v1/indexes/documents-synthetic/documents:batch',
    );
    expect(putCall[1]).toEqual({
      contour: 'test-stand',
      jobId: 'job-9',
      batchNo: 1,
      mode: 'canary',
      documents: [{ id: 'd1', body: { status: 'NEW' } }],
    });
    expect(putCall[2].headers['X-Service-Name']).toBe(
      'synthetic-data-generator',
    );
    expect(putCall[2].headers['Idempotency-Key']).toBe('job-9:1');
    expect(typeof putCall[2].validateStatus).toBe('function');
  });

  it('should_map_429_to_retryAfterMs_without_throwing', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    http.put.mockReturnValue(of({ status: 429, data: { retryAfterMs: 40 } }));
    await expect(
      client.upsertBatch({
        contour: 'test-stand',
        index: 'documents-synthetic',
        jobId: 'job-9',
        batchNo: 1,
        mode: 'canary',
        documents: [{ id: 'd1', body: { status: 'NEW' } }],
      }),
    ).resolves.toEqual({ accepted: [], rejected: [], retryAfterMs: 40 });
  });

  it('should_omit_index_from_refresh_and_search_bodies', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    http.post.mockReturnValue(
      of({ status: 200, data: { refreshed: true, total: 1, ids: ['d1'] } }),
    );
    await client.refresh({
      contour: 'test-stand',
      index: 'documents-synthetic',
    });
    const refreshCall = http.post.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
      { headers: Record<string, string> },
    ];
    expect(refreshCall[0]).toBe(
      'http://indexer.test/internal/v1/indexes/documents-synthetic:refresh',
    );
    expect(refreshCall[1]).toEqual({ contour: 'test-stand' });
    expect(refreshCall[2].headers).toBeDefined();
    await client.search({
      contour: 'test-stand',
      index: 'documents-synthetic',
      body: { filters: { status: 'NEW' } },
    });
    const searchCall = http.post.mock.calls[1] as unknown as [
      string,
      Record<string, unknown>,
    ];
    expect(searchCall[0]).toBe(
      'http://indexer.test/internal/v1/indexes/documents-synthetic/search',
    );
    expect(searchCall[1]).toEqual({
      contour: 'test-stand',
      body: { filters: { status: 'NEW' } },
    });
  });

  it('should_map_403_upsert_to_port_forbidden', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    http.put.mockReturnValue(
      of({ status: 403, data: { reason: 'prod_target' } }),
    );
    await expect(
      client.upsertBatch({
        contour: 'prod',
        index: 'documents-main',
        jobId: 'job-9',
        batchNo: 1,
        mode: 'canary',
        documents: [{ id: 'd1', body: { status: 'NEW' } }],
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'prod_target' });
  });
});
