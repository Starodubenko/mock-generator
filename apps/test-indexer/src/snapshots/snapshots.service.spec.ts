import { SnapshotsService } from './snapshots.service';
import { MemoryCluster } from '../opensearch/memory-cluster';
import { TEST_INDEX_MAPPINGS } from '../indexes/index-mapping';
import { IndexerForbiddenError } from '../http/indexer.exceptions';

describe('SnapshotsService', () => {
  it('should_refuse_synthetic_source', async () => {
    const cluster = new MemoryCluster();
    const snapshots = new SnapshotsService(cluster);
    await expect(
      snapshots.open({ contour: 'test-stand', sourceIndex: 'document-synthetic', sampleSize: 10 }),
    ).rejects.toBeInstanceOf(IndexerForbiddenError);
  });

  it('should_page_documents_copied_at_open', async () => {
    const cluster = new MemoryCluster();
    await cluster.createIndex('documents-reference', TEST_INDEX_MAPPINGS);
    await cluster.bulkUpsert('documents-reference', [
      { id: 'r1', body: { status: 'NEW' } },
      { id: 'r2', body: { status: 'ERROR' } },
    ]);
    await cluster.refresh('documents-reference');
    const snapshots = new SnapshotsService(cluster);
    const opened = await snapshots.open({
      contour: 'test-stand',
      sourceIndex: 'documents-reference',
      sampleSize: 10,
    });
    const first = await snapshots.read({ snapshotId: opened.snapshotId, contour: 'test-stand', limit: 1 });
    expect(first.documents).toHaveLength(1);
    expect(first.nextCursor).toBe('1');
    const second = await snapshots.read({
      snapshotId: opened.snapshotId,
      contour: 'test-stand',
      cursor: first.nextCursor,
      limit: 1,
    });
    expect(second.documents).toHaveLength(1);
    expect(second.nextCursor).toBeUndefined();
    await snapshots.close(opened.snapshotId);
    const gone = await snapshots.read({ snapshotId: opened.snapshotId, contour: 'test-stand', limit: 10 });
    expect(gone.documents).toEqual([]);
  });
});
