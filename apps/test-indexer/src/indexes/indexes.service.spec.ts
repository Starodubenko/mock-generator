import { IndexesService } from './indexes.service';
import { MemoryCluster } from '../opensearch/memory-cluster';
import { JobDocStore } from '../opensearch/job-doc-store';
import { IndexerForbiddenError, IndexerThrottleError } from '../http/indexer.exceptions';

describe('IndexesService', () => {
  const originalThrottle = process.env.TEST_THROTTLE_ONCE;
  const originalProd = process.env.PROD_CONTOURS;

  beforeEach(() => {
    process.env.OPENSEARCH_NODE = 'memory';
    process.env.TEST_THROTTLE_ONCE = '';
    process.env.PROD_CONTOURS = 'prod';
  });

  afterAll(() => {
    if (originalThrottle === undefined) {
      delete process.env.TEST_THROTTLE_ONCE;
    } else {
      process.env.TEST_THROTTLE_ONCE = originalThrottle;
    }
    if (originalProd === undefined) {
      delete process.env.PROD_CONTOURS;
    } else {
      process.env.PROD_CONTOURS = originalProd;
    }
  });

  const service = () => new IndexesService(new MemoryCluster(), new JobDocStore());

  it('should_upsert_the_same_batch_once', async () => {
    const indexes = service();
    const command = {
      index: 'documents-synthetic',
      contour: 'test-stand',
      jobId: 'job-1',
      batchNo: 1,
      mode: 'canary' as const,
      documents: [{ id: 'd1', body: { status: 'NEW' } }],
      idempotencyKey: 'job-1:1',
    };
    const first = await indexes.upsertBatch(command);
    const second = await indexes.upsertBatch(command);
    expect(second).toEqual(first);
    expect(first.accepted).toEqual(['d1']);
  });

  it('should_forbid_non_synthetic_index', async () => {
    const indexes = service();
    await expect(
      indexes.upsertBatch({
        index: 'documents-reference',
        contour: 'test-stand',
        jobId: 'job-1',
        batchNo: 1,
        mode: 'canary',
        documents: [{ id: 'd1', body: { status: 'NEW' } }],
        idempotencyKey: 'job-1:1',
      }),
    ).rejects.toBeInstanceOf(IndexerForbiddenError);
  });

  it('should_forbid_prod_contour', async () => {
    const indexes = service();
    await expect(
      indexes.upsertBatch({
        index: 'documents-synthetic',
        contour: 'prod',
        jobId: 'job-1',
        batchNo: 1,
        mode: 'canary',
        documents: [{ id: 'd1', body: { status: 'NEW' } }],
        idempotencyKey: 'job-1:1',
      }),
    ).rejects.toBeInstanceOf(IndexerForbiddenError);
  });

  it('should_throttle_once_then_accept_same_key', async () => {
    process.env.TEST_THROTTLE_ONCE = 'true';
    const indexes = service();
    const command = {
      index: 'documents-synthetic',
      contour: 'test-stand',
      jobId: 'job-retry',
      batchNo: 1,
      mode: 'canary' as const,
      documents: [{ id: 'd1', body: { status: 'NEW' } }],
      idempotencyKey: 'job-retry:1',
    };
    await expect(indexes.upsertBatch(command)).rejects.toBeInstanceOf(IndexerThrottleError);
    const second = await indexes.upsertBatch(command);
    expect(second.accepted).toEqual(['d1']);
  });

  it('should_search_filters_only_after_refresh', async () => {
    const indexes = service();
    await indexes.upsertBatch({
      index: 'documents-synthetic',
      contour: 'test-stand',
      jobId: 'job-1',
      batchNo: 1,
      mode: 'canary',
      documents: [
        {
          id: 'job-aaaa-00000001',
          body: { id: 'job-aaaa-00000001', status: 'NEW', messageType: 'type-a', creationDateTime: '2026-09-24T08:00:00+03:00' },
        },
      ],
      idempotencyKey: 'job-1:1',
    });
    const before = await indexes.search('documents-synthetic', 'test-stand', {
      filters: { id: 'job-aaaa-00000001' },
    });
    expect(before.total).toBe(0);
    await indexes.refresh('documents-synthetic', 'test-stand');
    const after = await indexes.search('documents-synthetic', 'test-stand', {
      filters: { status: 'NEW', goldenDay: '2026-09-24T08:00:00+03:00' },
    });
    expect(after).toEqual({ total: 1, ids: ['job-aaaa-00000001'] });
  });

  it('should_purge_only_job_documents', async () => {
    const indexes = service();
    await indexes.upsertBatch({
      index: 'documents-synthetic',
      contour: 'test-stand',
      jobId: 'job-a',
      batchNo: 1,
      mode: 'canary',
      documents: [{ id: 'a1', body: { status: 'NEW' } }],
      idempotencyKey: 'job-a:1',
    });
    await indexes.upsertBatch({
      index: 'documents-synthetic',
      contour: 'test-stand',
      jobId: 'job-b',
      batchNo: 1,
      mode: 'full',
      documents: [{ id: 'b1', body: { status: 'ERROR' } }],
      idempotencyKey: 'job-b:1',
    });
    await indexes.refresh('documents-synthetic', 'test-stand');
    await indexes.purge('documents-synthetic', 'test-stand', 'job-a');
    const left = await indexes.search('documents-synthetic', 'test-stand', {});
    expect(left.ids).toEqual(['b1']);
  });
});
