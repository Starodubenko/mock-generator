import {
  ConsoleLiveEventName,
  type ConsoleLiveJobEvent,
  type ConsoleLiveJobKind,
  type ConsoleLiveJobState,
} from '@entities/console-live/console-live.contract';
import type { JobRecord } from '@entities/job/job.types';

export const toConsoleLiveEvent = (
  job: JobRecord,
  draftCount: number,
): ConsoleLiveJobEvent => ({
  type: ConsoleLiveEventName.JobChanged,
  jobId: job.jobId,
  contour: job.contour,
  kind: job.kind as ConsoleLiveJobKind,
  state: job.state as ConsoleLiveJobState,
  reason: job.reason,
  publishedCount: job.publishedCount,
  quarantineCount: job.quarantineCount,
  requestedCount: job.requestedCount,
  draftCount,
  profileVersionId: job.profileVersionId,
});
