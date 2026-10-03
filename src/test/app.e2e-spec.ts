import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2eAppModule } from './e2e-app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.CONSOLE_SESSION_REQUIRED = 'false';
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [E2eAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'up' });
  });
});
