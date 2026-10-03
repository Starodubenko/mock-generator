import { Injectable } from '@nestjs/common';
import type { FailReason } from '@entities/job/fail-reason';
import {
  CloseSnapshotCommand,
  MappingQuery,
  OpenSearchIndexPort,
  OpenSnapshotCommand,
  OpenSnapshotResult,
  PortSearchQuery,
  PortSearchResult,
  PurgeJobCommand,
  ReadSnapshotCommand,
  ReadSnapshotResult,
  RefreshCommand,
  RefreshResult,
  UpsertBatchCommand,
  UpsertBatchResult,
  IndexMapping,
} from '@repositories/opensearch-index.port';
import { localCalendarDay } from '@entities/config/calendar-day';
import { asPlainString } from '@entities/json/as-plain-string';
import { inMemoryDatabase, type StoredDocument } from './in-memory-database';

type SearchFilters = {
  id?: string;
  status?: string;
  messageType?: string;
  goldenDay?: string;
  zone?: string;
  goldenUiToday?: boolean;
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const asSearchFilters = (value: unknown): SearchFilters | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    id: asOptionalString(record.id),
    status: asOptionalString(record.status),
    messageType: asOptionalString(record.messageType),
    goldenDay: asOptionalString(record.goldenDay),
    zone: asOptionalString(record.zone),
    goldenUiToday: record.goldenUiToday === true,
  };
};

const matchesGoldenFilters = (
  document: StoredDocument,
  filters: SearchFilters,
): boolean => {
  const body = document.body;
  if (
    filters.id !== undefined &&
    document.id !== filters.id &&
    body.id !== filters.id
  ) {
    return false;
  }
  if (filters.status !== undefined && body.status !== filters.status) {
    return false;
  }
  if (
    filters.messageType !== undefined &&
    body.messageType !== filters.messageType
  ) {
    return false;
  }
  const day =
    filters.goldenDay !== undefined
      ? localCalendarDay(filters.goldenDay, filters.zone ?? 'UTC')
      : null;
  if (day !== null) {
    const created = asPlainString(body.creationDateTime);
    if (!created.startsWith(day)) {
      return false;
    }
  }
  if (filters.goldenUiToday) {
    if (body.status === undefined || body.creationDateTime === undefined) {
      return false;
    }
  }
  return true;
};

@Injectable()
export class LocalOpenSearchIndexAdapter extends OpenSearchIndexPort {
  async openSnapshot(
    command: OpenSnapshotCommand,
  ): Promise<OpenSnapshotResult> {
    if (this.isSyntheticSource(command.sourceIndex)) {
      throw Object.assign(new Error('source_is_synthetic'), {
        reason: 'source_is_synthetic',
      });
    }
    const snapshotId = `pit-${Date.now()}`;
    const seedDocs =
      inMemoryDatabase.snapshotPages.get(command.sourceIndex) ?? [];
    inMemoryDatabase.snapshotPages.set(
      snapshotId,
      seedDocs.slice(0, command.sampleSize),
    );
    return { snapshotId, keepAliveMs: 60_000 };
  }

  async readSnapshot(
    command: ReadSnapshotCommand,
  ): Promise<ReadSnapshotResult> {
    const docs = inMemoryDatabase.snapshotPages.get(command.snapshotId) ?? [];
    return { documents: docs.slice(0, command.limit), nextCursor: undefined };
  }

  async closeSnapshot(command: CloseSnapshotCommand): Promise<void> {
    void command;
  }

  async getMapping(query: MappingQuery): Promise<IndexMapping> {
    return {
      index: query.index,
      dynamic: 'strict',
      fields: [
        { path: 'status', type: 'keyword' },
        { path: 'messageType', type: 'keyword' },
        { path: 'creationDateTime', type: 'date' },
      ],
    };
  }

  async upsertBatch(command: UpsertBatchCommand): Promise<UpsertBatchResult> {
    const idempotencyKey = `${command.jobId}:${command.batchNo}`;
    const cached = inMemoryDatabase.batchResults.get(idempotencyKey);
    if (cached) {
      return { ...cached };
    }
    if (
      !this.isSyntheticIndex(command.index) ||
      this.isProdContour(command.contour)
    ) {
      throw Object.assign(new Error('forbidden'), {
        status: 403,
        reason: 'prod_target',
      });
    }
    if (inMemoryDatabase.throttleOnce.has(idempotencyKey)) {
      inMemoryDatabase.throttleOnce.delete(idempotencyKey);
      return { accepted: [], rejected: [], retryAfterMs: 1 };
    }
    const store =
      inMemoryDatabase.documentsByIndex.get(command.index) ??
      new Map<string, StoredDocument>();
    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: FailReason }> = [];
    for (const doc of command.documents) {
      if (doc.body.status === 'INVALID_MAPPING') {
        rejected.push({ id: doc.id, reason: 'mapping_incompatible' });
        continue;
      }
      store.set(doc.id, {
        id: doc.id,
        jobId: command.jobId,
        body: doc.body,
        visibleAfterRefresh: false,
      });
      accepted.push(doc.id);
    }
    inMemoryDatabase.documentsByIndex.set(command.index, store);
    const result = { accepted, rejected };
    inMemoryDatabase.batchResults.set(idempotencyKey, result);
    return result;
  }

  async refresh(command: RefreshCommand): Promise<RefreshResult> {
    inMemoryDatabase.refreshedIndices.add(
      `${command.contour}:${command.index}`,
    );
    const store = inMemoryDatabase.documentsByIndex.get(command.index);
    if (store) {
      for (const doc of store.values()) {
        doc.visibleAfterRefresh = true;
      }
    }
    return { refreshed: true };
  }

  async search(query: PortSearchQuery): Promise<PortSearchResult> {
    const refreshKey = `${query.contour}:${query.index}`;
    if (!inMemoryDatabase.refreshedIndices.has(refreshKey)) {
      return { total: 0, ids: [] };
    }
    const store =
      inMemoryDatabase.documentsByIndex.get(query.index) ??
      new Map<string, StoredDocument>();
    const filters = asSearchFilters(query.body.filters);
    const ids = [...store.values()]
      .filter((document) => document.visibleAfterRefresh)
      .filter((document) =>
        filters ? matchesGoldenFilters(document, filters) : true,
      )
      .map((document) => document.id);
    return { total: ids.length, ids };
  }

  async purgeJobDocuments(command: PurgeJobCommand): Promise<void> {
    if (!this.isSyntheticIndex(command.index)) {
      throw Object.assign(new Error('forbidden'), { status: 403 });
    }
    const store = inMemoryDatabase.documentsByIndex.get(command.index);
    if (!store) {
      return;
    }
    for (const [id, doc] of store) {
      if (doc.jobId === command.jobId) {
        store.delete(id);
      }
    }
  }

  isSyntheticIndex(index: string): boolean {
    return (
      inMemoryDatabase.syntheticIndices.has(index) ||
      index.endsWith('-synthetic')
    );
  }

  isSyntheticSource(sourceIndex: string): boolean {
    return inMemoryDatabase.syntheticSources.has(sourceIndex);
  }

  isProdContour(contour: string): boolean {
    return contour === 'prod' || contour.startsWith('prod-');
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
