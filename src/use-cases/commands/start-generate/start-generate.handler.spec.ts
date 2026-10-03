import {
  StartGenerateHandler,
  hashGenerateBody,
} from './start-generate.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type { ProfileVersion } from '@entities/profile/profile.types';
import type { OpenSearchIndexPort } from '@repositories/opensearch-index.port';

const version: ProfileVersion = {
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths: [
    {
      path: 'status',
      pathClass: 'category',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 2,
      missingKeyRate: 0,
      categoryValues: ['NEW', 'ERROR'],
    },
    {
      path: 'hits.hits',
      pathClass: 'array',
      itemPathClass: 'nested',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    },
  ],
};

const indexPort = {
  isProdContour: () => false,
  isSyntheticIndex: () => true,
} as unknown as OpenSearchIndexPort;

describe('StartGenerateHandler', () => {
  const previousContours = process.env.ALLOWED_CONTOURS;
  const store = new InMemoryProcessStore();

  beforeEach(async () => {
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
    inMemoryDatabase.jobs.clear();
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.enumExtrasByVersion.clear();
    inMemoryDatabase.activeVersionByContour.clear();
    inMemoryDatabase.idempotency.clear();
    await store.saveProfile(version);
    await store.setActiveVersionId('document', 'test-stand', 'v1');
  });

  afterEach(() => {
    process.env.ALLOWED_CONTOURS = previousContours;
  });

  it('should_reject_unknown_enum_before_job', async () => {
    const handler = new StartGenerateHandler(indexPort, store);
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        seed: 's',
        count: 2,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
        idempotencyKey: 'k-bad',
        bodyHash: 'h-bad',
        fieldConstraints: [
          { path: 'status', kind: 'category', values: ['CLOSED'] },
        ],
      }),
    ).rejects.toThrow(DomainHttpException);
    expect(await store.listJobs({})).toHaveLength(0);
  });

  it('should_store_valid_constraints_on_job', async () => {
    const handler = new StartGenerateHandler(indexPort, store);
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      seed: 's',
      count: 2,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
      idempotencyKey: 'k-ok',
      bodyHash: 'h-ok',
      fieldConstraints: [{ path: 'status', kind: 'category', values: ['NEW'] }],
    });
    expect(result.job.fieldConstraints).toEqual([
      { path: 'status', kind: 'category', values: ['NEW'] },
    ]);
  });

  it('should_accept_constraint_from_enum_extra', async () => {
    await store.addEnumExtra(
      'document',
      'test-stand',
      'v1',
      'status',
      'CLOSED',
    );
    const handler = new StartGenerateHandler(indexPort, store);
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      seed: 's',
      count: 2,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
      idempotencyKey: 'k-extra',
      bodyHash: 'h-extra',
      fieldConstraints: [
        { path: 'status', kind: 'category', values: ['CLOSED'] },
      ],
    });
    expect(result.job.fieldConstraints).toEqual([
      { path: 'status', kind: 'category', values: ['CLOSED'] },
    ]);
  });

  it('should_stamp_generatedAt_when_form_omits_it', async () => {
    const handler = new StartGenerateHandler(indexPort, store);
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      seed: 's',
      count: 2,
      targetIndex: 'documents-synthetic',
      idempotencyKey: 'k-now',
      bodyHash: 'h-now',
    });
    expect(result.job.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.job.generatedAt).toContain('+03:00');
  });

  it('should_change_hash_when_constraints_change', () => {
    const base = {
      documentType: 'document',
      contour: 'test-stand',
      seed: 's',
      count: 2,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
    };
    const without = hashGenerateBody(base);
    const withNew = hashGenerateBody({
      ...base,
      fieldConstraints: [{ path: 'status', kind: 'category', values: ['NEW'] }],
    });
    const withError = hashGenerateBody({
      ...base,
      fieldConstraints: [
        { path: 'status', kind: 'category', values: ['ERROR'] },
      ],
    });
    expect(without).not.toBe(withNew);
    expect(withNew).not.toBe(withError);
    expect(hashGenerateBody({ ...base, generatedAt: '' })).toBe(
      hashGenerateBody({
        documentType: 'document',
        contour: 'test-stand',
        seed: 's',
        count: 2,
        targetIndex: 'documents-synthetic',
      }),
    );
    expect(
      hashGenerateBody({
        ...base,
        fieldConstraints: [
          { path: 'status', kind: 'category', values: ['ERROR', 'NEW'] },
        ],
      }),
    ).toBe(
      hashGenerateBody({
        ...base,
        fieldConstraints: [
          { path: 'status', kind: 'category', values: ['NEW', 'ERROR'] },
        ],
      }),
    );
    expect(hashGenerateBody({ ...base, arrayPaths: ['hits.hits'] })).not.toBe(
      without,
    );
  });

  it('should_reject_unknown_array_path', async () => {
    const handler = new StartGenerateHandler(indexPort, store);
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        seed: 's',
        count: 2,
        targetIndex: 'documents-synthetic',
        generatedAt: '2026-09-24T21:00:00+03:00',
        idempotencyKey: 'k-array',
        bodyHash: 'h-array',
        arrayPaths: ['missing'],
      }),
    ).rejects.toThrow(DomainHttpException);
    const ok = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      seed: 's',
      count: 2,
      targetIndex: 'documents-synthetic',
      generatedAt: '2026-09-24T21:00:00+03:00',
      idempotencyKey: 'k-array-ok',
      bodyHash: 'h-array-ok',
      arrayPaths: ['hits.hits', 'hits.hits'],
    });
    expect(ok.job.arrayPaths).toEqual(['hits.hits']);
  });
});
