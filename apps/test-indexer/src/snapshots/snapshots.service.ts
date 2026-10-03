import { Inject, Injectable } from '@nestjs/common';
import { isProdContour, isSyntheticIndex, loadIndexerConfig, type IndexerConfig } from '../config';
import { IndexerForbiddenError, IndexerNotFoundError } from '../http/indexer.exceptions';
import { ClusterPort } from '../opensearch/cluster.port';

type SnapshotPage = {
  documents: Record<string, unknown>[];
};

@Injectable()
export class SnapshotsService {
  private readonly config: IndexerConfig = loadIndexerConfig();
  private readonly pages = new Map<string, SnapshotPage>();

  constructor(@Inject(ClusterPort) private readonly cluster: ClusterPort) {}

  async open(command: { contour: string; sourceIndex: string; sampleSize: number }) {
    if (isProdContour(this.config, command.contour)) {
      throw new IndexerForbiddenError('prod_target');
    }
    if (isSyntheticIndex(this.config, command.sourceIndex)) {
      throw new IndexerForbiddenError('source_is_synthetic');
    }
    if (!(await this.cluster.indexExists(command.sourceIndex))) {
      throw new IndexerNotFoundError('missing_required');
    }
    const found = await this.cluster.search(command.sourceIndex, {
      query: { match_all: {} },
      size: command.sampleSize,
      sort: [{ _id: 'asc' }],
    });
    const snapshotId = `pit-${Date.now()}-${found.ids.length}`;
    this.pages.set(snapshotId, {
      documents: found.sources.map((item) => item.source),
    });
    return { snapshotId, keepAliveMs: 60_000 };
  }

  async read(command: { snapshotId: string; contour: string; cursor?: string | null; limit: number }) {
    if (isProdContour(this.config, command.contour)) {
      throw new IndexerForbiddenError('prod_target');
    }
    const page = this.pages.get(command.snapshotId);
    if (!page) {
      return { documents: [] };
    }
    const start = command.cursor ? Number(command.cursor) || 0 : 0;
    const documents = page.documents.slice(start, start + command.limit);
    const next = start + documents.length;
    return {
      documents,
      nextCursor: next < page.documents.length ? String(next) : undefined,
    };
  }

  async close(snapshotId: string): Promise<void> {
    this.pages.delete(snapshotId);
  }
}
