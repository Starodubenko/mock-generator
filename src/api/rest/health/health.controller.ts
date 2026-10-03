import { Controller, Get, Inject, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  OPENSEARCH_INDEX_PORT,
  OpenSearchIndexPort,
} from '@repositories/opensearch-index.port';
import { loadServiceConfig } from '@entities/config/service-config';
import { ApiBearerGuard } from '../api-bearer.guard';

@ApiTags('health')
@Controller('api/v1')
export class HealthController {
  constructor(
    @Inject(OPENSEARCH_INDEX_PORT)
    private readonly indexPort: OpenSearchIndexPort,
  ) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'up' };
  }

  @Get('ready')
  @UseGuards(ApiBearerGuard)
  async ready(
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ status: string; indexer?: string }> {
    const up = await this.indexPort.ping();
    if (!up) {
      res.status(503);
      return { status: 'down', indexer: 'down' };
    }
    return { status: 'up' };
  }

  @Get('document-types')
  @UseGuards(ApiBearerGuard)
  documentTypes(): {
    items: Array<{ documentType: string; enabled: boolean }>;
  } {
    const config = loadServiceConfig();
    return { items: config.enabledDocumentTypes };
  }

  @Get('contours')
  @UseGuards(ApiBearerGuard)
  contours(): { items: Array<{ contour: string; timeZone: string }> } {
    const config = loadServiceConfig();
    return { items: config.allowedContours };
  }
}
