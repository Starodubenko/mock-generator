import type { FailReason } from '@entities/job/fail-reason';
import type { JobRecord } from '@entities/job/job.types';
import type { ProfileVersion } from '@entities/profile/profile.types';

export const PROCESS_STORE = Symbol('PROCESS_STORE');

export type IdempotencyRecord = {
  key: string;
  bodyHash: string;
  jobId: string;
};

export type QuarantineItem = {
  documentId: string;
  reason: FailReason;
};

export type DraftDocument = {
  id: string;
  body: Record<string, unknown>;
};

export type ActivationRecord = {
  documentType: string;
  contour: string;
  versionId: string;
  previousVersionId: string | null;
  activatedAt: string;
};

export type DocumentTypeRecord = {
  documentType: string;
};

export type JobListFilter = {
  contour?: string;
  kind?: string;
  state?: string;
  documentType?: string;
};

export abstract class ProcessStore {
  abstract getJob(jobId: string): Promise<JobRecord | undefined>;
  abstract saveJob(job: JobRecord): Promise<void>;
  abstract listJobs(filter: JobListFilter): Promise<JobRecord[]>;
  abstract hasTrainingInFlight(key: string): Promise<boolean>;
  abstract setTrainingInFlight(key: string, jobId: string): Promise<void>;
  abstract clearTrainingInFlight(key: string): Promise<void>;
  abstract getIdempotency(key: string): Promise<IdempotencyRecord | undefined>;
  abstract saveIdempotency(record: IdempotencyRecord): Promise<void>;
  abstract getProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<ProfileVersion | undefined>;
  abstract saveProfile(version: ProfileVersion): Promise<void>;
  abstract getEnumExtras(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<Record<string, string[]>>;
  abstract addEnumExtra(
    documentType: string,
    contour: string,
    versionId: string,
    path: string,
    value: string,
  ): Promise<void>;
  abstract listProfiles(
    documentType: string,
    contour: string,
  ): Promise<ProfileVersion[]>;
  abstract deleteProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void>;
  abstract getVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<string | undefined>;
  abstract setVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
    label: string,
  ): Promise<void>;
  abstract getActiveVersionId(
    documentType: string,
    contour: string,
  ): Promise<string | undefined>;
  abstract setActiveVersionId(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void>;
  abstract appendActivation(record: ActivationRecord): Promise<void>;
  abstract wasActivated(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<boolean>;
  abstract getQuarantine(jobId: string): Promise<QuarantineItem[]>;
  abstract appendQuarantine(
    jobId: string,
    items: QuarantineItem[],
  ): Promise<void>;
  abstract markSyntheticIndex(index: string): Promise<void>;
  abstract markSyntheticSource(sourceIndex: string): Promise<void>;
  abstract appendPublishedIds(jobId: string, ids: string[]): Promise<void>;
  abstract getPublishedIds(jobId: string): Promise<string[]>;
  abstract saveDraftDocuments(
    jobId: string,
    documents: DraftDocument[],
  ): Promise<void>;
  abstract getDraftDocuments(jobId: string): Promise<DraftDocument[]>;
  abstract listDocumentTypes(): Promise<DocumentTypeRecord[]>;
  abstract hasDocumentType(documentType: string): Promise<boolean>;
  abstract addDocumentType(documentType: string): Promise<void>;
  abstract deleteDocumentType(documentType: string): Promise<void>;
}
