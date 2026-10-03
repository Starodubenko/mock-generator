export type ClusterHit = {
  id: string;
  source: Record<string, unknown>;
};

export type BulkItem = {
  id: string;
  ok: boolean;
  mappingError: boolean;
};

export type ClusterMapping = {
  exists: boolean;
  dynamic: 'strict' | 'false';
  properties: Record<string, unknown>;
};

export abstract class ClusterPort {
  abstract ping(): Promise<boolean>;
  abstract indexExists(index: string): Promise<boolean>;
  abstract createIndex(index: string, mappings: Record<string, unknown>): Promise<void>;
  abstract getMapping(index: string): Promise<ClusterMapping>;
  abstract search(
    index: string,
    body: Record<string, unknown>,
  ): Promise<{ total: number; ids: string[]; sources: ClusterHit[] }>;
  abstract bulkUpsert(index: string, documents: Array<{ id: string; body: Record<string, unknown> }>): Promise<BulkItem[]>;
  abstract refresh(index: string): Promise<void>;
  abstract deleteIds(index: string, ids: string[]): Promise<void>;
}
