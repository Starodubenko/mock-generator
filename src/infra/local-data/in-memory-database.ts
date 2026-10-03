import type { JobRecord } from '@entities/job/job.types';
import type { ProfileVersion } from '@entities/profile/profile.types';
import type { FailReason } from '@entities/job/fail-reason';

export type IdempotencyRecord = {
  key: string;
  bodyHash: string;
  jobId: string;
};

export type StoredDocument = {
  id: string;
  jobId: string;
  body: Record<string, unknown>;
  visibleAfterRefresh: boolean;
};

export type QuarantineItem = {
  documentId: string;
  reason: FailReason;
};

export type ActivationJournalEntry = {
  documentType: string;
  contour: string;
  versionId: string;
  previousVersionId: string | null;
  activatedAt: string;
};

export class InMemoryDatabase {
  jobs = new Map<string, JobRecord>();
  profileVersions = new Map<string, ProfileVersion>();
  activeVersionByContour = new Map<string, string>();
  idempotency = new Map<string, IdempotencyRecord>();
  syntheticIndices = new Set<string>();
  syntheticSources = new Set<string>();
  documentsByIndex = new Map<string, Map<string, StoredDocument>>();
  refreshedIndices = new Set<string>();
  quarantineByJob = new Map<string, QuarantineItem[]>();
  trainingInFlight = new Map<string, string>();
  batchResults = new Map<
    string,
    { accepted: string[]; rejected: Array<{ id: string; reason: FailReason }> }
  >();
  snapshotPages = new Map<string, Record<string, unknown>[]>();
  activationJournal: ActivationJournalEntry[] = [];
  publishedIdsByJob = new Map<string, string[]>();
  draftDocumentsByJob = new Map<
    string,
    Array<{ id: string; body: Record<string, unknown> }>
  >();
  mockResources = new Map<
    string,
    {
      method: string;
      path: string;
      group: string;
      summary: string;
      jobId: string;
      body: unknown | undefined;
      updatedAt: string;
    }
  >();
  mockGroups = new Set<string>();
  enumExtrasByVersion = new Map<string, Map<string, string[]>>();
  versionLabels = new Map<string, string>();
  documentTypes = new Map<string, string>();
  documentTypesSeeded = false;
  throttleOnce = new Set<string>();
}

export const inMemoryDatabase = new InMemoryDatabase();
