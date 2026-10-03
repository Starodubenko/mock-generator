import {
  CONSOLE_LIVE_FORBIDDEN_FIELDS,
  CONSOLE_LIVE_JOB_KIND_VALUES,
  CONSOLE_LIVE_JOB_STATE_VALUES,
  ConsoleLiveEventName,
  type ConsoleLiveJobEvent,
  type ConsoleLiveJobKind,
  type ConsoleLiveJobState,
} from './console-live.contract';
import type { FailReason } from '../job/fail-reason';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const asCount = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;

export const serializeConsoleLiveEvent = (event: ConsoleLiveJobEvent): string =>
  JSON.stringify(event);

export const parseConsoleLiveEvent = (
  raw: string,
): ConsoleLiveJobEvent | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const row = asRecord(parsed);
  if (!row || row.type !== ConsoleLiveEventName.JobChanged) {
    return null;
  }
  if (Object.keys(row).some((key) => CONSOLE_LIVE_FORBIDDEN_FIELDS.has(key))) {
    return null;
  }
  const jobId = asString(row.jobId);
  const contour = asString(row.contour);
  const kind = asString(row.kind);
  const state = asString(row.state);
  const publishedCount = asCount(row.publishedCount);
  const quarantineCount = asCount(row.quarantineCount);
  const draftCount = asCount(row.draftCount);
  const requestedCount =
    row.requestedCount === null ? null : asCount(row.requestedCount);
  const profileVersionId =
    row.profileVersionId === null ? null : asString(row.profileVersionId);
  const reason = row.reason === null ? null : asString(row.reason);
  if (
    !jobId ||
    !contour ||
    !kind ||
    !state ||
    !CONSOLE_LIVE_JOB_KIND_VALUES.has(kind) ||
    !CONSOLE_LIVE_JOB_STATE_VALUES.has(state) ||
    publishedCount === null ||
    quarantineCount === null ||
    draftCount === null ||
    requestedCount === undefined ||
    profileVersionId === undefined ||
    reason === undefined
  ) {
    return null;
  }
  return {
    type: ConsoleLiveEventName.JobChanged,
    jobId,
    contour,
    kind: kind as ConsoleLiveJobKind,
    state: state as ConsoleLiveJobState,
    reason: reason as FailReason | null,
    publishedCount,
    quarantineCount,
    requestedCount,
    draftCount,
    profileVersionId,
  };
};
