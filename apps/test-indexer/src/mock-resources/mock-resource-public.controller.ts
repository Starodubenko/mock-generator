import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MockResourcesService } from './mock-resources.service';

@Controller()
export class MockResourcePublicController {
  constructor(private readonly resources: MockResourcesService) {}

  @All('{*path}')
  async any(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (req.path.startsWith('/internal/v1')) {
      res.status(404).end();
      return;
    }
    const body = await this.resources.get(req.path, req.method);
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
