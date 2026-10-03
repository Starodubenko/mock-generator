import { CONSOLE_LIVE_REPLAY_LIMIT } from './console-live.contract';

export const rememberLatestJobEvent = <T extends { jobId: string }>(
  latestByJob: Map<string, T>,
  event: T,
  limit = CONSOLE_LIVE_REPLAY_LIMIT,
): T[] => {
  if (latestByJob.has(event.jobId)) {
    latestByJob.delete(event.jobId);
  }
  latestByJob.set(event.jobId, event);
  while (latestByJob.size > limit) {
    const oldest = [...latestByJob.keys()][0];
    if (oldest === undefined) {
      break;
    }
    latestByJob.delete(oldest);
  }
  return [...latestByJob.values()];
};
