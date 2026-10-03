import {
  ConsoleLiveJobState,
  type ConsoleLiveJobEvent,
} from '@frontend/entities/console-live/console-live.contract';

export const aliasVersionFromLiveEvent = (
  event: ConsoleLiveJobEvent,
  jobId: string,
): string | null => {
  if (event.jobId !== jobId || event.state !== ConsoleLiveJobState.Succeeded) {
    return null;
  }
  return event.profileVersionId;
};
