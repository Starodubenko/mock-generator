import { Controller, Get, Inject, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ServiceAuthGuard } from '../auth/service-auth.guard';
import { ClusterPort } from '../opensearch/cluster.port';

@Controller('internal/v1')
@UseGuards(ServiceAuthGuard)
export class HealthController {
  constructor(@Inject(ClusterPort) private readonly cluster: ClusterPort) {}

  @Get('health')
  async health(@Res({ passthrough: true }) res: Response): Promise<{ status: string }> {
    const up = await this.cluster.ping();
    if (!up) {
      res.status(503);
      return { status: 'down' };
    }
    return { status: 'up' };
  }
}
