import { LocalOpenSearchIndexAdapter } from './local-opensearch-index.adapter';
import { inMemoryDatabase } from './in-memory-database';

describe('LocalOpenSearchIndexAdapter', () => {
  const adapter = new LocalOpenSearchIndexAdapter();

  beforeEach(() => {
    inMemoryDatabase.documentsByIndex.clear();
    inMemoryDatabase.refreshedIndices.clear();
    inMemoryDatabase.batchResults.clear();
    inMemoryDatabase.syntheticSources.clear();
  });

  it('should_reject_synthetic_source_on_open_snapshot', async () => {
    inMemoryDatabase.syntheticSources.add('filled-by-generator');
    await expect(
      adapter.openSnapshot({
        contour: 'test-stand',
        sourceIndex: 'filled-by-generator',
        sampleSize: 10,
      }),
    ).rejects.toMatchObject({ message: 'source_is_synthetic' });
  });

  it('should_upsert_idempotently_with_same_batch_key', async () => {
    const command = {
      contour: 'test-stand',
      index: 'documents-synthetic',
      jobId: 'job-1',
      batchNo: 1,
      mode: 'canary' as const,
      documents: [{ id: 'd1', body: { status: 'NEW' } }],
    };
    const first = await adapter.upsertBatch(command);
    const second = await adapter.upsertBatch(command);
    expect(second).toEqual(first);
  });

  it('should_forbid_non_synthetic_index_with_403', async () => {
    await expect(
      adapter.upsertBatch({
        contour: 'test-stand',
        index: 'documents-reference',
        jobId: 'job-1',
        batchNo: 1,
        mode: 'canary',
        documents: [{ id: 'd1', body: { status: 'NEW' } }],
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'prod_target' });
  });

  it('should_retry_same_batch_after_retryAfterMs', async () => {
    inMemoryDatabase.throttleOnce.add('job-retry:1');
    const command = {
      contour: 'test-stand',
      index: 'documents-synthetic',
      jobId: 'job-retry',
      batchNo: 1,
      mode: 'canary' as const,
      documents: [{ id: 'd1', body: { status: 'NEW' } }],
    };
    const first = await adapter.upsertBatch(command);
    expect(first.retryAfterMs).toBe(1);
    const second = await adapter.upsertBatch(command);
    expect(second.accepted).toEqual(['d1']);
  });
});
