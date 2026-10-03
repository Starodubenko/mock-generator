import { Inject, Injectable } from '@nestjs/common';
import { isProdContour, isSyntheticIndex, loadIndexerConfig, type IndexerConfig } from '../config';
import { IndexerForbiddenError, IndexerNotFoundError, IndexerThrottleError } from '../http/indexer.exceptions';
import { ClusterPort } from '../opensearch/cluster.port';
import { JobDocStore } from '../opensearch/job-doc-store';
import { asGoldenFilters, goldenFiltersToQuery } from './golden-filters';
import { flattenMappingProperties, TEST_INDEX_MAPPINGS } from './index-mapping';

export type UpsertCommand = {
  index: string;
  contour: string;
  jobId: string;
  batchNo: number;
  mode: 'canary' | 'full';
  documents: Array<{ id: string; body: Record<string, unknown> }>;
  idempotencyKey: string;
};

@Injectable()
export class IndexesService {
  private readonly config: IndexerConfig = loadIndexerConfig();
  private readonly batchResults = new Map<
    string,
    { accepted: string[]; rejected: Array<{ id: string; reason: string }> }
  >();
  private readonly throttled = new Set<string>();

  constructor(
    @Inject(ClusterPort) private readonly cluster: ClusterPort,
    private readonly jobs: JobDocStore,
  ) {}

  async getMapping(index: string, contour: string) {
    this.assertContour(contour);
    if (isSyntheticIndex(this.config, index)) {
      await this.ensureSynthetic(index);
    }
    const mapping = await this.cluster.getMapping(index);
    if (!mapping.exists) {
      throw new IndexerNotFoundError();
    }
    return {
      index,
      dynamic: mapping.dynamic,
      fields: flattenMappingProperties(mapping.properties),
    };
  }

  async upsertBatch(command: UpsertCommand) {
    this.assertWritable(command.index, command.contour);
    const cached = this.batchResults.get(command.idempotencyKey);
    if (cached) {
      return { ...cached };
    }
    if (this.shouldThrottle(command.idempotencyKey)) {
      throw new IndexerThrottleError(1);
    }
    await this.ensureSynthetic(command.index);
    const items = await this.cluster.bulkUpsert(command.index, command.documents);
    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: string }> = [];
    for (const item of items) {
      if (item.ok) {
        accepted.push(item.id);
      } else {
        rejected.push({
          id: item.id,
          reason: item.mappingError ? 'mapping_incompatible' : 'transport_rejected',
        });
      }
    }
    this.jobs.remember(command.index, command.jobId, accepted);
    const result = { accepted, rejected };
    this.batchResults.set(command.idempotencyKey, result);
    return result;
  }

  async refresh(index: string, contour: string) {
    this.assertContour(contour);
    if (isSyntheticIndex(this.config, index)) {
      await this.ensureSynthetic(index);
    }
    await this.cluster.refresh(index);
    return { refreshed: true as const };
  }

  async search(index: string, contour: string, body: Record<string, unknown>) {
    this.assertContour(contour);
    const filters = asGoldenFilters(body);
    const queryBody = filters
      ? { query: goldenFiltersToQuery(filters), size: 10000, _source: false }
      : { ...body, _source: false };
    const found = await this.cluster.search(index, queryBody);
    return { total: found.total, ids: found.ids };
  }

  async purge(index: string, contour: string, jobId: string) {
    this.assertWritable(index, contour);
    const ids = this.jobs.list(index, jobId);
    await this.cluster.deleteIds(index, ids);
    this.jobs.forget(index, jobId);
  }

  private shouldThrottle(key: string): boolean {
    if (process.env.TEST_THROTTLE_ONCE !== 'true') {
      return false;
    }
    if (this.throttled.has(key)) {
      return false;
    }
    this.throttled.add(key);
    return true;
  }

  private assertContour(contour: string): void {
    if (isProdContour(this.config, contour)) {
      throw new IndexerForbiddenError('prod_target');
    }
  }

  private assertWritable(index: string, contour: string): void {
    this.assertContour(contour);
    if (!isSyntheticIndex(this.config, index)) {
      throw new IndexerForbiddenError('prod_target');
    }
  }

  private async ensureSynthetic(index: string): Promise<void> {
    if (await this.cluster.indexExists(index)) {
      return;
    }
    await this.cluster.createIndex(index, TEST_INDEX_MAPPINGS);
  }
}
