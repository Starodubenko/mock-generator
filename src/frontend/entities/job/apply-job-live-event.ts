import type { ConsoleLiveJobEvent } from '../console-live/console-live.contract';

export type JobLiveView = {
  jobId: string;
  kind: string;
  state: string;
  reason: string | null;
  contour: string;
  profileVersionId: string | null;
  publishedCount: number;
  quarantineCount: number;
  requestedCount: number | null;
  draftCount: number;
};

export const applyJobLiveEvent = (
  current: JobLiveView,
  event: ConsoleLiveJobEvent,
): JobLiveView => {
  if (event.jobId !== current.jobId) {
    return current;
  }
  return {
    ...current,
    kind: event.kind,
    state: event.state,
    reason: event.reason,
    contour: event.contour,
    profileVersionId: event.profileVersionId,
    publishedCount: event.publishedCount,
    quarantineCount: event.quarantineCount,
    requestedCount: event.requestedCount,
    draftCount: event.draftCount,
  };
};
