import { StartTrainingHandler } from './start-training.handler';
import type { JobRecord } from '@entities/job/job.types';
import type { ProfileVersion } from '@entities/profile/profile.types';
import type { OpenSearchIndexPort } from '@repositories/opensearch-index.port';
import type {
  IdempotencyRecord,
  JobListFilter,
  ProcessStore,
} from '@repositories/process-store.port';

const createStore = (): ProcessStore => {
  const jobs = new Map<string, JobRecord>();
  const keys = new Map<string, IdempotencyRecord>();
  const inFlight = new Map<string, string>();
  const profiles = new Map<string, ProfileVersion>();
  return {
    getJob: async (jobId: string) => jobs.get(jobId),
    saveJob: async (job: JobRecord) => {
      jobs.set(job.jobId, job);
    },
    listJobs: async (filter: JobListFilter) =>
      [...jobs.values()].filter(
        (job) =>
          (!filter.contour || job.contour === filter.contour) &&
          (!filter.kind || job.kind === filter.kind) &&
          (!filter.documentType || job.documentType === filter.documentType),
      ),
    getIdempotency: async (key: string) => keys.get(key),
    saveIdempotency: async (record: IdempotencyRecord) => {
      keys.set(record.key, record);
    },
    hasTrainingInFlight: async (key: string) => inFlight.has(key),
    setTrainingInFlight: async (key: string, jobId: string) => {
      inFlight.set(key, jobId);
    },
    clearTrainingInFlight: async (key: string) => {
      inFlight.delete(key);
    },
    saveProfile: async (version: ProfileVersion) => {
      profiles.set(version.versionId, version);
    },
    getProfile: async () => undefined,
    getEnumExtras: async () => ({}),
    addEnumExtra: async () => undefined,
    listProfiles: async () => [],
    deleteProfile: async () => undefined,
    getVersionLabel: async () => undefined,
    setVersionLabel: async () => undefined,
    getActiveVersionId: async () => undefined,
    setActiveVersionId: async () => undefined,
    appendActivation: async () => undefined,
    wasActivated: async () => false,
    getQuarantine: async () => [],
    appendQuarantine: async () => undefined,
    markSyntheticIndex: async () => undefined,
    markSyntheticSource: async () => undefined,
    appendPublishedIds: async () => undefined,
    getPublishedIds: async () => [],
    saveDraftDocuments: async () => undefined,
    getDraftDocuments: async () => [],
    listDocumentTypes: async () => [],
    hasDocumentType: async () => false,
    addDocumentType: async () => undefined,
    deleteDocumentType: async () => undefined,
  };
};

describe('StartTrainingHandler', () => {
  const previousContours = process.env.ALLOWED_CONTOURS;

  beforeEach(() => {
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
  });

  afterEach(() => {
    process.env.ALLOWED_CONTOURS = previousContours;
  });

  it('should_profile_attached_documents_without_snapshot', async () => {
    const openSnapshot = jest.fn();
    const getMapping = jest.fn().mockResolvedValue({
      index: 'document-synthetic',
      dynamic: 'strict',
      fields: [],
    });
    const store = createStore();
    const handler = new StartTrainingHandler(
      { openSnapshot, getMapping } as unknown as OpenSearchIndexPort,
      store,
    );
    const documents = Array.from({ length: 12 }, (_, index) => ({
      status: 'NEW',
      messageType: 'type-a',
      n: index,
    }));
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      documents,
      sampleSize: 12,
      aliases: [],
      idempotencyKey: 'k1',
      bodyHash: 'h1',
    });
    expect(result.job.kind).toBe('train');
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    expect(openSnapshot).not.toHaveBeenCalled();
    expect(getMapping).toHaveBeenCalled();
    const stored = await store.getJob(result.job.jobId);
    expect(stored?.state).toBe('succeeded');
    expect(stored?.profileVersionId).toBeTruthy();
  });

  it('should_reject_missing_documents_before_job', async () => {
    const store = createStore();
    const handler = new StartTrainingHandler(
      { getMapping: jest.fn() } as unknown as OpenSearchIndexPort,
      store,
    );
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        documents: [],
        sampleSize: 10,
        aliases: [],
        idempotencyKey: 'k2',
        bodyHash: 'h2',
      }),
    ).rejects.toThrow();
    expect(await store.listJobs({})).toHaveLength(0);
  });

  it('should_fail_job_when_neighbor_rejects_profile', async () => {
    const store = createStore();
    store.saveProfile = async () => {
      throw Object.assign(new Error('process_store_413'), { status: 413 });
    };
    const handler = new StartTrainingHandler(
      {
        getMapping: jest.fn().mockResolvedValue({
          index: 'document-synthetic',
          dynamic: 'strict',
          fields: [],
        }),
      } as unknown as OpenSearchIndexPort,
      store,
    );
    const documents = Array.from({ length: 12 }, (_, index) => ({
      status: 'NEW',
      n: index,
    }));
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      documents,
      sampleSize: 12,
      aliases: [],
      idempotencyKey: 'k3',
      bodyHash: 'h3',
    });
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    const stored = await store.getJob(result.job.jobId);
    expect(stored?.state).toBe('failed');
    expect(stored?.reason).toBe('transport_rejected');
  });
});
