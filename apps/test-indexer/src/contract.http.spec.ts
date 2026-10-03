import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { loadIndexerConfig } from './config';
import { AppModule } from './app.module';
import { createProcessPrisma } from './process-store/postgres-process.store';

const headers = {
  'content-type': 'application/json',
  'X-Service-Name': 'synthetic-data-generator',
};

describe('test-indexer http contract', () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    process.env.OPENSEARCH_NODE = 'memory';
    process.env.SEED_REFERENCE_PATH = '';
    process.env.POSTGRES_HOST = '127.0.0.1';
    process.env.POSTGRES_PORT = process.env.POSTGRES_PORT ?? '5434';
    process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? 'indexer';
    process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'indexer';
    process.env.POSTGRES_DB = 'indexer_test';
    process.env.SEED_DOCUMENT_TYPES = 'document';
    const prisma = createProcessPrisma(loadIndexerConfig());
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "mock_groups" (
        "name" TEXT NOT NULL,
        CONSTRAINT "mock_groups_pkey" PRIMARY KEY ("name")
      )
    `);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE
        jobs, profile_versions, active_versions, idempotency, training_in_flight,
        enum_extras, version_labels, activation_journal, quarantine, synthetic_indices,
        synthetic_sources, published_ids, draft_documents, document_types, meta,
        mock_resources, mock_groups
       RESTART IDENTITY CASCADE`,
    );
    await prisma.$disconnect();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0);
    base = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should_reject_missing_service_name', async () => {
    const response = await fetch(`${base}/internal/v1/health`);
    expect(response.status).toBe(401);
  });

  it('should_health_upsert_refresh_search_and_forbid_reference', async () => {
    const health = await fetch(`${base}/internal/v1/health`, { headers });
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'up' });

    const forbidden = await fetch(
      `${base}/internal/v1/indexes/documents-reference/documents:batch`,
      {
        method: 'PUT',
        headers: { ...headers, 'Idempotency-Key': 'job-x:1' },
        body: JSON.stringify({
          contour: 'test-stand',
          jobId: 'job-x',
          batchNo: 1,
          mode: 'canary',
          documents: [{ id: 'd1', body: { status: 'NEW' } }],
        }),
      },
    );
    expect(forbidden.status).toBe(403);

    const upsert = await fetch(
      `${base}/internal/v1/indexes/documents-synthetic/documents:batch`,
      {
        method: 'PUT',
        headers: { ...headers, 'Idempotency-Key': 'job-1:1' },
        body: JSON.stringify({
          contour: 'test-stand',
          jobId: 'job-1',
          batchNo: 1,
          mode: 'canary',
          documents: [
            {
              id: 'job-1-1',
              body: {
                id: 'job-1-1',
                status: 'NEW',
                creationDateTime: '2026-09-24T08:00:00+03:00',
              },
            },
          ],
        }),
      },
    );
    expect(upsert.status).toBe(200);
    expect(await upsert.json()).toEqual({
      accepted: ['job-1-1'],
      rejected: [],
    });

    const refresh = await fetch(
      `${base}/internal/v1/indexes/documents-synthetic:refresh`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ contour: 'test-stand' }),
      },
    );
    expect(refresh.status).toBe(200);
    expect(await refresh.json()).toEqual({ refreshed: true });

    const search = await fetch(
      `${base}/internal/v1/indexes/documents-synthetic/search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contour: 'test-stand',
          body: { filters: { status: 'NEW' } },
        }),
      },
    );
    expect(search.status).toBe(200);
    expect(await search.json()).toEqual({ total: 1, ids: ['job-1-1'] });

    const mapping = await fetch(
      `${base}/internal/v1/indexes/documents-synthetic/mapping?contour=test-stand`,
      { headers },
    );
    expect(mapping.status).toBe(200);
    const mapped = (await mapping.json()) as {
      dynamic: string;
      fields: Array<{ path: string }>;
    };
    expect(mapped.dynamic).toBe('false');
    expect(mapped.fields.some((item) => item.path === 'status')).toBe(true);
  });

  it('should_persist_process_store_schema_over_rpc', async () => {
    const missing = await fetch(`${base}/internal/v1/process-store`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ op: 'getJob', args: { jobId: 'missing' } }),
    });
    expect(missing.status).toBe(200);
    expect(await missing.json()).toEqual({ result: null });

    const save = await fetch(`${base}/internal/v1/process-store`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        op: 'saveJob',
        args: {
          job: {
            jobId: 'job-store-1',
            kind: 'generate',
            documentType: 'document',
            contour: 'test-stand',
            state: 'preview',
            profileVersionId: 'v1',
            seed: 'seed',
            requestedCount: 1,
            publishedCount: 0,
            quarantineCount: 0,
            reason: null,
            createdAt: '2026-01-01T00:00:00Z',
            finishedAt: null,
            checkpointDocumentNumber: 0,
            targetIndex: 'documents-synthetic',
            generatedAt: '2026-01-01T00:00:00Z',
          },
        },
      }),
    });
    expect(save.status).toBe(200);

    const types = await fetch(`${base}/internal/v1/process-store`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ op: 'listDocumentTypes', args: {} }),
    });
    expect(types.status).toBe(200);
    expect(await types.json()).toEqual({
      result: [{ documentType: 'document' }],
    });

    const loaded = await fetch(`${base}/internal/v1/process-store`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ op: 'getJob', args: { jobId: 'job-store-1' } }),
    });
    expect(loaded.status).toBe(200);
    const body = (await loaded.json()) as {
      result: { jobId: string; state: string };
    };
    expect(body.result.jobId).toBe('job-store-1');
    expect(body.result.state).toBe('preview');

    const unknown = await fetch(`${base}/internal/v1/process-store`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ op: 'notARealOp', args: {} }),
    });
    expect(unknown.status).toBe(400);
  });

  it('should_upsert_list_and_serve_mock_resources_or_404', async () => {
    const missing = await fetch(`${base}/api/tasks`);
    expect(missing.status).toBe(404);

    const health = await fetch(`${base}/internal/v1/health`, { headers });
    expect(health.status).toBe(200);

    const created = await fetch(`${base}/internal/v1/mock-resources`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        method: 'GET',
        path: '/api/tasks',
        group: 'Tasks',
        summary: 'Список задач',
      }),
    });
    expect(created.status).toBe(200);
    expect(await created.json()).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/api/tasks',
        group: 'Tasks',
        hasBody: false,
      }),
    );

    const catalogOnly = await fetch(`${base}/api/tasks`);
    expect(catalogOnly.status).toBe(404);

    const bound = await fetch(`${base}/internal/v1/mock-resources/body`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        method: 'GET',
        path: '/api/tasks',
        jobId: 'job-mock-1',
        body: { took: 2 },
      }),
    });
    expect(bound.status).toBe(200);

    const listed = await fetch(`${base}/internal/v1/mock-resources`, {
      headers,
    });
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual({
      resources: [
        expect.objectContaining({
          path: '/api/tasks',
          method: 'GET',
          group: 'Tasks',
          hasBody: true,
        }),
      ],
    });

    const served = await fetch(`${base}/api/tasks`);
    expect(served.status).toBe(200);
    expect(await served.json()).toEqual({ took: 2 });

    const otherMethod = await fetch(`${base}/api/unknown-mock`, {
      method: 'POST',
    });
    expect(otherMethod.status).toBeGreaterThanOrEqual(400);

    const invalid = await fetch(`${base}/internal/v1/mock-resources`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        method: 'GET',
        path: '/internal/v1/health',
        group: 'Tasks',
      }),
    });
    expect(invalid.status).toBe(400);
  });
});
