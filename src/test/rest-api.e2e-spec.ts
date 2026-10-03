import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { E2eAppModule } from './e2e-app.module';
import { ProblemJsonFilter } from '@app/problem-json.filter';

describe('REST API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    delete process.env.PLATFORM_SERVICE_TOKEN;
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [E2eAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ProblemJsonFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST trainings returns 202 then 200 on replay', async () => {
    const body = {
      contour: 'test-stand',
      documents: [
        { status: 'NEW', messageType: 'type-a' },
        { status: 'ERROR', messageType: 'type-b' },
      ],
      sampleSize: 100,
    };
    const http = app.getHttpServer() as Parameters<typeof request>[0];
    const first = await request(http)
      .post('/api/v1/profiles/document/trainings')
      .set('Authorization', 'Bearer dev')
      .set('Idempotency-Key', 'train-1')
      .send(body)
      .expect(202);
    const firstBody = first.body as { kind: string; jobId: string };
    expect(firstBody.kind).toBe('train');
    const second = await request(http)
      .post('/api/v1/profiles/document/trainings')
      .set('Authorization', 'Bearer dev')
      .set('Idempotency-Key', 'train-1')
      .send(body)
      .expect(200);
    const secondBody = second.body as { jobId: string };
    expect(secondBody.jobId).toBe(firstBody.jobId);
  });
});

describe('REST API bearer (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.PLATFORM_SERVICE_TOKEN = 'test-token';
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [E2eAppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ProblemJsonFilter());
    await app.init();
  });

  afterEach(async () => {
    delete process.env.PLATFORM_SERVICE_TOKEN;
    await app.close();
  });

  it('rejects protected route without bearer', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api/v1/contours')
      .expect(401)
      .expect('Content-Type', /application\/problem\+json/);
  });
});
