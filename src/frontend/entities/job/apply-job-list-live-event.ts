import type { ConsoleLiveJobEvent } from '../console-live/console-live.contract';
import { rankJobs } from './rank-jobs';

export type JobListRow = {
  jobId: string;
  kind: string;
  state: string;
  createdAt: string;
  documentType: string;
  requestedCount: number | null;
};

export const applyJobListLiveEvent = (
  current: JobListRow[],
  event: ConsoleLiveJobEvent,
  contour: string,
): { rows: JobListRow[]; isNew: boolean } => {
  if (event.contour !== contour) {
    return { rows: current, isNew: false };
  }
  const existing = current.find((row) => row.jobId === event.jobId);
  const nextRow: JobListRow = {
    jobId: event.jobId,
    kind: event.kind,
    state: event.state,
    createdAt: existing?.createdAt ?? '',
    documentType: existing?.documentType ?? '',
    requestedCount: existing?.requestedCount ?? event.requestedCount,
  };
  const rows = rankJobs(
    existing
      ? current.map((row) =>
          row.jobId === event.jobId ? { ...row, ...nextRow } : row,
        )
      : [...current, nextRow],
  );
  return { rows, isNew: !existing };
};
