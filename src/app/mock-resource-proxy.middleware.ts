import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  isReservedConsolePath,
  normalizeMockResourcePath,
} from '@entities/mock-resource/mock-resource-path';
import {
  MOCK_RESOURCE_PORT,
  MockResourcePort,
} from '@repositories/mock-resource.port';

@Injectable()
export class MockResourceProxyMiddleware implements NestMiddleware {
  constructor(
    @Inject(MOCK_RESOURCE_PORT)
    private readonly resources: MockResourcePort,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    if (isReservedConsolePath(req.path)) {
      next();
      return;
    }
    const path = normalizeMockResourcePath(req.path);
    if (!path) {
      next();
      return;
    }
    let body: unknown;
    try {
      body = await this.resources.get(path, req.method);
    } catch {
      res.status(404).end();
      return;
    }
    if (body === undefined) {
      res.status(404).end();
      return;
    }
    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
    res.status(200).json(body);
  }
}
