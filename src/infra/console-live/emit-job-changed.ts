import {
  ConsoleLiveJobKind,
  isConsoleLiveKind,
} from '@entities/console-live/console-live.contract';
import type { JobRecord } from '@entities/job/job.types';
import type { ConsoleLivePort } from '@repositories/console-live.port';
import type { ProcessStore } from '@repositories/process-store.port';
import { toConsoleLiveEvent } from './to-console-live-event';

export const emitJobChanged = async (
  live: ConsoleLivePort | undefined,
  store: ProcessStore,
  job: JobRecord,
): Promise<void> => {
  if (!live) {
    return;
  }
  try {
    const drafts = isConsoleLiveKind(job.kind, ConsoleLiveJobKind.Generate)
      ? await store.getDraftDocuments(job.jobId)
      : [];
    live.publish(toConsoleLiveEvent(job, drafts.length));
  } catch {
    return;
  }
};
