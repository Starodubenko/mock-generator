import type { FailReason } from '@entities/job/fail-reason';
import type { UpsertBatchResult } from '@repositories/opensearch-index.port';

export type NeighborHttpResponse = {
  status: number;
  data: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};

export const neighborRetryAfterMs = (data: unknown): number => {
  const retryAfterMs = asRecord(data).retryAfterMs;
  return typeof retryAfterMs === 'number' && retryAfterMs > 0
    ? retryAfterMs
    : 1000;
};

export const neighborReason = (data: unknown, fallback: string): string => {
  const reason = asRecord(data).reason;
  return typeof reason === 'string' && reason.length > 0 ? reason : fallback;
};

export const throwIfForbidden = (
  response: NeighborHttpResponse,
  fallbackReason: string,
): void => {
  if (response.status !== 403) {
    return;
  }
  throw Object.assign(new Error('forbidden'), {
    status: 403,
    reason: neighborReason(response.data, fallbackReason),
  });
};

const asRejected = (value: unknown): UpsertBatchResult['rejected'] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (item === null || typeof item !== 'object') {
      return [];
    }
    const row = item as { id?: unknown; reason?: unknown };
    if (typeof row.id !== 'string' || typeof row.reason !== 'string') {
      return [];
    }
    return [{ id: row.id, reason: row.reason as FailReason }];
  });
};

export const upsertFromNeighborResponse = (
  response: NeighborHttpResponse,
): UpsertBatchResult => {
  throwIfForbidden(response, 'prod_target');
  if (response.status === 429) {
    return {
      accepted: [],
      rejected: [],
      retryAfterMs: neighborRetryAfterMs(response.data),
    };
  }
  const data = asRecord(response.data);
  const accepted = Array.isArray(data.accepted)
    ? data.accepted.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    accepted,
    rejected: asRejected(data.rejected),
    retryAfterMs:
      typeof data.retryAfterMs === 'number' ? data.retryAfterMs : undefined,
  };
};
