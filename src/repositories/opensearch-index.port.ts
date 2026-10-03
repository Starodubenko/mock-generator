import type { FailReason } from '@entities/job/fail-reason';

export const OPENSEARCH_INDEX_PORT = Symbol('OPENSEARCH_INDEX_PORT');

export type OpenSnapshotCommand = {
  contour: string;
  sourceIndex: string;
  sampleSize: number;
};

export type OpenSnapshotResult = {
  snapshotId: string;
  keepAliveMs: number;
};

export type ReadSnapshotCommand = {
  contour: string;
  snapshotId: string;
  cursor?: string;
  limit: number;
};

export type ReadSnapshotResult = {
  documents: Record<string, unknown>[];
  nextCursor?: string;
};

export type CloseSnapshotCommand = {
  contour: string;
  snapshotId: string;
};

export type MappingQuery = {
  contour: string;
  index: string;
};

export type IndexMapping = {
  index: string;
  dynamic: 'strict' | 'false';
  fields: Array<{
    path: string;
    type: string;
    ignoreAbove?: number;
  }>;
};

export type UpsertBatchCommand = {
  contour: string;
  index: string;
  jobId: string;
  batchNo: number;
  mode: 'canary' | 'full';
  documents: Array<{ id: string; body: Record<string, unknown> }>;
};

export type UpsertBatchResult = {
  accepted: string[];
  rejected: Array<{ id: string; reason: FailReason }>;
  retryAfterMs?: number;
};

export type RefreshCommand = {
  contour: string;
  index: string;
};

export type RefreshResult = {
  refreshed: true;
};

export type PortSearchQuery = {
  contour: string;
  index: string;
  body: Record<string, unknown>;
};

export type PortSearchResult = {
  total: number;
  ids: string[];
};

export type PurgeJobCommand = {
  contour: string;
  index: string;
  jobId: string;
};

export abstract class OpenSearchIndexPort {
  abstract openSnapshot(
    command: OpenSnapshotCommand,
  ): Promise<OpenSnapshotResult>;
  abstract readSnapshot(
    command: ReadSnapshotCommand,
  ): Promise<ReadSnapshotResult>;
  abstract closeSnapshot(command: CloseSnapshotCommand): Promise<void>;
  abstract getMapping(query: MappingQuery): Promise<IndexMapping>;
  abstract upsertBatch(command: UpsertBatchCommand): Promise<UpsertBatchResult>;
  abstract refresh(command: RefreshCommand): Promise<RefreshResult>;
  abstract search(query: PortSearchQuery): Promise<PortSearchResult>;
  abstract purgeJobDocuments(command: PurgeJobCommand): Promise<void>;
  abstract isSyntheticIndex(index: string): boolean;
  abstract isSyntheticSource(sourceIndex: string): boolean;
  abstract isProdContour(contour: string): boolean;
  abstract ping(): Promise<boolean>;
}
