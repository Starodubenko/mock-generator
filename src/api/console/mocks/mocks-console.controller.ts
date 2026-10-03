import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Layout, Render } from '@nestjs-ssr/react';
import { ConsoleLayout } from '@views/layout';
import { MocksPage } from '@frontend/pages/mocks/views/mocks-page';
import { ListMockResourcesHandler } from '@use-cases/queries/list-mock-resources/list-mock-resources.handler';
import { ListMockGroupsHandler } from '@use-cases/queries/list-mock-groups/list-mock-groups.handler';
import { GetJobHandler } from '@use-cases/queries/get-job/get-job.handler';
import { GetJobDraftsHandler } from '@use-cases/queries/get-job-drafts/get-job-drafts.handler';
import { UpsertMockEndpointHandler } from '@use-cases/commands/upsert-mock-endpoint/upsert-mock-endpoint.handler';
import { DeleteMockEndpointHandler } from '@use-cases/commands/delete-mock-endpoint/delete-mock-endpoint.handler';
import { AddMockGroupHandler } from '@use-cases/commands/add-mock-group/add-mock-group.handler';
import { DeleteMockGroupHandler } from '@use-cases/commands/delete-mock-group/delete-mock-group.handler';
import { SaveMockResourceHandler } from '@use-cases/commands/save-mock-resource/save-mock-resource.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { ConsoleSessionGuard } from '../console-session.guard';
import { ConsoleJsonGuard } from '../console-json.guard';
import { withToast } from '../with-toast';
import { asPlainString } from '@entities/json/as-plain-string';

const asString = (value: unknown, fallback = ''): string =>
  asPlainString(value, fallback);

const reasonOf = (error: unknown): string => {
  if (error instanceof DomainHttpException) {
    return (error.getResponse() as { reason: string }).reason;
  }
  if (error && typeof error === 'object' && 'reason' in error) {
    const reason = (error as { reason?: unknown }).reason;
    if (typeof reason === 'string' && reason) {
      return reason;
    }
  }
  throw error;
};

const publicOriginOf = (req: Request): string => {
  const host = req.get('host') ?? '';
  return host ? `${req.protocol}://${host}`.replace(/\/$/, '') : '';
};

const asTargets = (value: unknown): Array<{ method: string; path: string }> => {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.flatMap((item) => {
    const text = asString(item);
    const space = text.indexOf(' ');
    if (space < 0) {
      return [];
    }
    return [{ method: text.slice(0, space), path: text.slice(space + 1) }];
  });
};

const mocksHref = (
  contour: string,
  extras: Record<string, string> = {},
): string => {
  const params = new URLSearchParams({ contour, ...extras });
  return `/mocks?${params.toString()}`;
};

@Controller('mocks')
@Layout(ConsoleLayout)
@UseGuards(ConsoleSessionGuard, ConsoleJsonGuard)
export class MocksConsoleController {
  constructor(
    private readonly listResources: ListMockResourcesHandler,
    private readonly listGroups: ListMockGroupsHandler,
    private readonly getJob: GetJobHandler,
    private readonly getJobDrafts: GetJobDraftsHandler,
    private readonly upsertEndpoint: UpsertMockEndpointHandler,
    private readonly deleteEndpoint: DeleteMockEndpointHandler,
    private readonly addGroup: AddMockGroupHandler,
    private readonly deleteGroup: DeleteMockGroupHandler,
    private readonly saveResource: SaveMockResourceHandler,
  ) {}

  @Get('new')
  @Render(MocksPage, { jsonApi: false })
  createPage(
    @Req() req: Request,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
    @Query('jobId') jobId = '',
    @Query('addGroup') addGroup = '',
    @Query('addPath') addPath = '',
    @Query('addHttpMethod') addHttpMethod = '',
    @Query('addSummary') addSummary = '',
  ) {
    return this.buildPage({
      contour,
      reason,
      jobId,
      addGroup,
      addPath,
      addHttpMethod,
      addSummary,
      publicOrigin: publicOriginOf(req),
      addEndpoint: true,
    });
  }

  @Get()
  @Render(MocksPage, { jsonApi: false })
  page(
    @Req() req: Request,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
    @Query('jobId') jobId = '',
    @Query('addGroup') addGroup = '',
    @Query('confirmDeleteGroup') confirmDeleteGroup = '',
    @Query('confirmDeleteMethod') confirmDeleteMethod = '',
    @Query('confirmDeletePath') confirmDeletePath = '',
    @Query('confirmBind') confirmBind: string | null = null,
    @Query('bindGroup') bindGroup = '',
    @Query('endpoint') endpoint?: unknown,
  ) {
    return this.buildPage({
      contour,
      reason,
      jobId,
      addGroup,
      publicOrigin: publicOriginOf(req),
      confirmDeleteGroup,
      confirmDeleteMethod,
      confirmDeletePath,
      confirmBind: Boolean(confirmBind),
      bindGroup,
      bindTargets: asTargets(endpoint).map(
        (item) => `${item.method} ${item.path}`,
      ),
    });
  }

  @Post('groups')
  async createGroup(
    @Body() body: { contour?: string; name?: string },
    @Res() res: Response,
  ) {
    const contour = asString(body.contour, 'test-stand');
    try {
      await this.addGroup.execute(asString(body.name));
      res.redirect(303, withToast(mocksHref(contour), 'mock_catalog_saved'));
    } catch (error) {
      res.redirect(
        303,
        mocksHref(contour, {
          reason: reasonOf(error),
          addGroup: asString(body.name),
        }),
      );
    }
  }

  @Post('groups/delete')
  async dropGroup(
    @Body() body: { contour?: string; name?: string },
    @Res() res: Response,
  ) {
    const contour = asString(body.contour, 'test-stand');
    try {
      await this.deleteGroup.execute(asString(body.name));
      res.redirect(303, withToast(mocksHref(contour), 'mock_endpoint_deleted'));
    } catch (error) {
      res.redirect(303, mocksHref(contour, { reason: reasonOf(error) }));
    }
  }

  @Post('endpoints')
  async createEndpoint(
    @Body()
    body: {
      contour?: string;
      method?: string;
      httpMethod?: string;
      path?: string;
      group?: string;
      summary?: string;
    },
    @Res() res: Response,
  ) {
    const contour = asString(body.contour, 'test-stand');
    try {
      await this.upsertEndpoint.execute({
        method: asString(body.httpMethod || body.method),
        path: asString(body.path),
        group: asString(body.group),
        summary: asString(body.summary),
      });
      res.redirect(303, withToast(mocksHref(contour), 'mock_catalog_saved'));
    } catch (error) {
      res.redirect(
        303,
        `/mocks/new?${new URLSearchParams({
          contour,
          reason: reasonOf(error),
          addGroup: asString(body.group),
          addPath: asString(body.path),
          addHttpMethod: asString(body.httpMethod || body.method),
          addSummary: asString(body.summary),
        }).toString()}`,
      );
    }
  }

  @Post('endpoints/delete')
  async dropEndpoint(
    @Body()
    body: {
      contour?: string;
      method?: string;
      httpMethod?: string;
      path?: string;
    },
    @Res() res: Response,
  ) {
    const contour = asString(body.contour, 'test-stand');
    try {
      await this.deleteEndpoint.execute(
        asString(body.httpMethod || body.method),
        asString(body.path),
      );
      res.redirect(303, withToast(mocksHref(contour), 'mock_endpoint_deleted'));
    } catch (error) {
      res.redirect(303, mocksHref(contour, { reason: reasonOf(error) }));
    }
  }

  @Post('bind')
  async bind(
    @Body() body: { contour?: string; jobId?: string; endpoint?: unknown },
    @Res() res: Response,
  ) {
    const contour = asString(body.contour, 'test-stand');
    const jobId = asString(body.jobId);
    try {
      const saved = await this.saveResource.execute({
        jobId,
        targets: asTargets(body.endpoint),
      });
      const origin = (process.env.INDEXER_BASE_URL ?? '').replace(/\/$/, '');
      const share = encodeURIComponent(
        `${origin}${saved.items[0]?.sharePath ?? ''}`,
      );
      res.redirect(
        303,
        withToast(
          `${mocksHref(contour)}&sharePath=${share}`,
          'mock_resource_saved',
        ),
      );
    } catch (error) {
      res.redirect(303, mocksHref(contour, { jobId, reason: reasonOf(error) }));
    }
  }

  private async buildPage(input: {
    contour: string;
    reason: string | null;
    jobId: string;
    addGroup: string;
    addPath?: string;
    addHttpMethod?: string;
    addSummary?: string;
    publicOrigin: string;
    addEndpoint?: boolean;
    confirmDeleteGroup?: string;
    confirmDeleteMethod?: string;
    confirmDeletePath?: string;
    confirmBind?: boolean;
    bindGroup?: string;
    bindTargets?: string[];
  }) {
    const endpoints = await this.listResources.execute();
    let draftCount = 0;
    if (input.jobId) {
      try {
        await this.getJob.execute(input.jobId);
        draftCount = (await this.getJobDrafts.execute(input.jobId)).length;
      } catch {
        draftCount = 0;
      }
    }
    return {
      contour: input.contour,
      reason: input.reason,
      groups: await this.listGroups.execute(),
      endpoints,
      shareOrigin: process.env.INDEXER_BASE_URL ?? '',
      publicOrigin: input.publicOrigin,
      addGroup: input.addGroup,
      addPath: input.addPath ?? '',
      addHttpMethod: input.addHttpMethod ?? '',
      addSummary: input.addSummary ?? '',
      addEndpoint: Boolean(input.addEndpoint),
      jobId: input.jobId || null,
      draftCount,
      confirmDeleteGroup: input.confirmDeleteGroup || null,
      confirmDeleteMethod: input.confirmDeleteMethod || null,
      confirmDeletePath: input.confirmDeletePath || null,
      confirmBind: Boolean(input.confirmBind),
      bindGroup: input.bindGroup ?? '',
      bindTargets: input.bindTargets ?? [],
      head: { title: 'Моки' },
    };
  }
}
