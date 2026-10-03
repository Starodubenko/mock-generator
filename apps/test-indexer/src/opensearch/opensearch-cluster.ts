import { Client } from '@opensearch-project/opensearch';
import { ClusterPort, type BulkItem, type ClusterHit, type ClusterMapping } from './cluster.port';

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export class OpenSearchCluster extends ClusterPort {
  constructor(private readonly client: Client) {
    super();
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return Boolean(response.body);
    } catch {
      return false;
    }
  }

  async indexExists(index: string): Promise<boolean> {
    const response = await this.client.indices.exists({ index });
    return Boolean(response.body);
  }

  async createIndex(index: string, mappings: Record<string, unknown>): Promise<void> {
    const exists = await this.indexExists(index);
    if (exists) {
      return;
    }
    await this.client.indices.create({
      index,
      body: { mappings },
    });
  }

  async getMapping(index: string): Promise<ClusterMapping> {
    try {
      const response = await this.client.indices.getMapping({ index });
      const body = asRecord(response.body);
      const indexBody = asRecord(body[index]);
      const mappings = asRecord(indexBody.mappings);
      const dynamic = mappings.dynamic === 'strict' ? 'strict' : 'false';
      return {
        exists: true,
        dynamic,
        properties: asRecord(mappings.properties),
      };
    } catch (error) {
      if (isNotFound(error)) {
        return { exists: false, dynamic: 'false', properties: {} };
      }
      throw error;
    }
  }

  async search(
    index: string,
    body: Record<string, unknown>,
  ): Promise<{ total: number; ids: string[]; sources: ClusterHit[] }> {
    const response = await this.client.search({ index, body });
    const payload = asRecord(response.body);
    const hitsRoot = asRecord(payload.hits);
    const totalNode = hitsRoot.total;
    const total =
      typeof totalNode === 'number' ? totalNode : Number(asRecord(totalNode).value ?? 0);
    const hits = Array.isArray(hitsRoot.hits) ? hitsRoot.hits : [];
    const sources: ClusterHit[] = hits.map((raw) => {
      const hit = asRecord(raw);
      return {
        id: String(hit._id ?? ''),
        source: asRecord(hit._source),
      };
    });
    return { total, ids: sources.map((item) => item.id), sources };
  }

  async bulkUpsert(
    index: string,
    documents: Array<{ id: string; body: Record<string, unknown> }>,
  ): Promise<BulkItem[]> {
    if (documents.length === 0) {
      return [];
    }
    const body = documents.flatMap((item) => [
      { index: { _index: index, _id: item.id } },
      item.body,
    ]);
    const response = await this.client.bulk({ refresh: false, body });
    const items = Array.isArray(asRecord(response.body).items)
      ? (asRecord(response.body).items as Array<Record<string, { status?: number; error?: { type?: string } }>>)
      : [];
    return documents.map((item, offset) => {
      const action = items[offset]?.index;
      const status = action?.status ?? 500;
      const errorType = action?.error?.type ?? '';
      const mappingError = errorType.includes('mapper') || errorType.includes('strict');
      return { id: item.id, ok: status < 300, mappingError };
    });
  }

  async refresh(index: string): Promise<void> {
    await this.client.indices.refresh({ index });
  }

  async deleteIds(index: string, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const body = ids.flatMap((id) => [{ delete: { _index: index, _id: id } }]);
    await this.client.bulk({ refresh: false, body });
  }
}

const isNotFound = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const status = (error as { statusCode?: number; meta?: { statusCode?: number } }).statusCode
    ?? (error as { meta?: { statusCode?: number } }).meta?.statusCode;
  return status === 404;
};
