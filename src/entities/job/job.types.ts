import type { FailReason } from './fail-reason';
import type { FieldConstraint } from './field-constraint';

export type JobKind = 'train' | 'generate';

export type JobState =
  | 'accepted'
  | 'profiling'
  | 'profile_ready'
  | 'activating'
  | 'preview'
  | 'canary'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type JobRecord = {
  jobId: string;
  kind: JobKind;
  documentType: string;
  contour: string;
  state: JobState;
  profileVersionId: string | null;
  seed: string | null;
  requestedCount: number | null;
  publishedCount: number;
  quarantineCount: number;
  reason: FailReason | null;
  createdAt: string;
  finishedAt: string | null;
  checkpointDocumentNumber: number;
  targetIndex: string | null;
  generatedAt: string | null;
  fieldConstraints?: FieldConstraint[];
  arrayPaths?: string[];
};
