import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MockResourcesService } from './mock-resources.service';

@Injectable()
export class MockResourcePublicMiddleware implements NestMiddleware {
  constructor(private readonly resources: MockResourcesService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.path.startsWith('/internal/v1')) {
      next();
      return;
    }
    const body = await this.resources.get(req.path, req.method);
    if (body === undefined) {
      next();
      return;
    }
    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
    res.status(200).json(body);
  }
}
