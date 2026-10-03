import { ClusterPort, type BulkItem, type ClusterHit, type ClusterMapping } from './cluster.port';

type StoredDoc = {
  id: string;
  body: Record<string, unknown>;
  visible: boolean;
};

export class MemoryCluster extends ClusterPort {
  readonly indexes = new Map<string, { mapping: ClusterMapping; docs: Map<string, StoredDoc> }>();

  async ping(): Promise<boolean> {
    return true;
  }

  async indexExists(index: string): Promise<boolean> {
    return this.indexes.has(index);
  }

  async createIndex(index: string, mappings: Record<string, unknown>): Promise<void> {
    if (this.indexes.has(index)) {
      return;
    }
    this.indexes.set(index, {
      mapping: {
        exists: true,
        dynamic: mappings.dynamic === 'strict' ? 'strict' : 'false',
        properties: (mappings.properties as Record<string, unknown>) ?? {},
      },
      docs: new Map(),
    });
  }

  async getMapping(index: string): Promise<ClusterMapping> {
    const found = this.indexes.get(index);
    if (!found) {
      return { exists: false, dynamic: 'false', properties: {} };
    }
    return found.mapping;
  }

  async search(
    index: string,
    body: Record<string, unknown>,
  ): Promise<{ total: number; ids: string[]; sources: ClusterHit[] }> {
    const store = this.indexes.get(index);
    if (!store) {
      return { total: 0, ids: [], sources: [] };
    }
    const query = (body.query as Record<string, unknown> | undefined) ?? { match_all: {} };
    const hits = [...store.docs.values()]
      .filter((doc) => doc.visible)
      .filter((doc) => matchesQuery(doc.body, query));
    const size = typeof body.size === 'number' ? body.size : hits.length;
    const sliced = hits.slice(0, size);
    return {
      total: hits.length,
      ids: sliced.map((item) => item.id),
      sources: sliced.map((item) => ({ id: item.id, source: item.body })),
    };
  }

  async bulkUpsert(
    index: string,
    documents: Array<{ id: string; body: Record<string, unknown> }>,
  ): Promise<BulkItem[]> {
    const store = this.indexes.get(index);
    if (!store) {
      return documents.map((item) => ({ id: item.id, ok: false, mappingError: true }));
    }
    return documents.map((item) => {
      if (item.body.status === 'INVALID_MAPPING') {
        return { id: item.id, ok: false, mappingError: true };
      }
      store.docs.set(item.id, { id: item.id, body: item.body, visible: false });
      return { id: item.id, ok: true, mappingError: false };
    });
  }

  async refresh(index: string): Promise<void> {
    const store = this.indexes.get(index);
    if (!store) {
      return;
    }
    for (const doc of store.docs.values()) {
      doc.visible = true;
    }
  }

  async deleteIds(index: string, ids: string[]): Promise<void> {
    const store = this.indexes.get(index);
    if (!store) {
      return;
    }
    for (const id of ids) {
      store.docs.delete(id);
    }
  }
}

const matchesQuery = (body: Record<string, unknown>, query: Record<string, unknown>): boolean => {
  if ('match_all' in query) {
    return true;
  }
  const bool = query.bool as { must?: Record<string, unknown>[] } | undefined;
  if (!bool?.must) {
    return true;
  }
  return bool.must.every((clause) => {
    const term = clause.term as Record<string, string> | undefined;
    if (term) {
      const [field, value] = Object.entries(term)[0] ?? [];
      return field ? body[field] === value : true;
    }
    const exists = clause.exists as { field?: string } | undefined;
    if (exists?.field) {
      return body[exists.field] !== undefined;
    }
    const range = clause.range as Record<string, { gte?: string; lte?: string }> | undefined;
    if (range?.creationDateTime) {
      const created = String(body.creationDateTime ?? '');
      const day = created.slice(0, 10);
      const gte = range.creationDateTime.gte?.slice(0, 10);
      return !gte || day === gte;
    }
    return true;
  });
};
