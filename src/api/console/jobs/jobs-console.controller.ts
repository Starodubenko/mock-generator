import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { Layout, Render } from '@nestjs-ssr/react';
import { ConsoleLayout } from '@views/layout';
import { JobListPage } from '@frontend/pages/jobs/views/job-list-page';
import { GeneratePage } from '@frontend/pages/jobs/views/generate-page';
import { JobPage } from '@frontend/pages/jobs/views/job-page';
import { JobStatus } from '@frontend/pages/jobs/views/job-status';
import { QuarantinePage } from '@frontend/pages/jobs/views/quarantine-page';
import {
  StartGenerateHandler,
  hashGenerateBody,
} from '@use-cases/commands/start-generate/start-generate.handler';
import { PublishJobHandler } from '@use-cases/commands/publish-job/publish-job.handler';
import { CancelJobHandler } from '@use-cases/commands/cancel-job/cancel-job.handler';
import { GetJobHandler } from '@use-cases/queries/get-job/get-job.handler';
import { GetJobDraftsHandler } from '@use-cases/queries/get-job-drafts/get-job-drafts.handler';
import { ListJobsHandler } from '@use-cases/queries/list-jobs/list-jobs.handler';
import { GetQuarantineHandler } from '@use-cases/queries/get-quarantine/get-quarantine.handler';
import { ListProfileVersionsHandler } from '@use-cases/queries/list-profile-versions/list-profile-versions.handler';
import { GetProfileVersionHandler } from '@use-cases/queries/get-profile-version/get-profile-version.handler';
import { constraintFieldsFromProfile } from '@entities/job/constraint-fields-from-profile';
import type { ConstraintField } from '@entities/job/constraint-fields-from-profile';
import { parseConstraintForm } from '@entities/job/parse-constraint-form';
import { normalizeArrayPaths } from '@entities/job/array-paths';
import { DomainHttpException } from '@app/domain-http.exception';
import { documentTypesHref } from '../document-types/document-types-href';
import { ConsoleSessionGuard } from '../console-session.guard';
import { ConsoleJsonGuard } from '../console-json.guard';
import { withToast } from '../with-toast';
import { contourTimeZone } from '@entities/config/service-config';
import { asPlainString } from '@entities/json/as-plain-string';

const DOCUMENT_TYPE = 'document';

const asString = (value: unknown, fallback = ''): string =>
  asPlainString(value, fallback);

const DRAFT_JSON_PREVIEW_LIMIT = 20;

const reasonOf = (error: unknown): string => {
  if (error instanceof DomainHttpException) {
    return (error.getResponse() as { reason: string }).reason;
  }
  throw error;
};

@Controller('jobs')
@Layout(ConsoleLayout)
@UseGuards(ConsoleSessionGuard, ConsoleJsonGuard)
export class JobsConsoleController {
  constructor(
    private readonly startGenerate: StartGenerateHandler,
    private readonly publishJob: PublishJobHandler,
    private readonly cancelJob: CancelJobHandler,
    private readonly getJob: GetJobHandler,
    private readonly getJobDrafts: GetJobDraftsHandler,
    private readonly listJobs: ListJobsHandler,
    private readonly getQuarantine: GetQuarantineHandler,
    private readonly listProfileVersions: ListProfileVersionsHandler,
    private readonly getProfileVersion: GetProfileVersionHandler,
  ) {}

  @Get()
  @Render(JobListPage, { jsonApi: false })
  async list(@Query('contour') contour = 'test-stand') {
    const jobs = (await this.listJobs.execute({ contour })).items.map(
      (job) => ({
        jobId: job.jobId,
        kind: job.kind,
        state: job.state,
        createdAt: job.createdAt,
        documentType: job.documentType,
        requestedCount: job.requestedCount,
      }),
    );
    return {
      contour,
      timeZone: contourTimeZone(contour),
      jobs,
      head: { title: 'Задания' },
    };
  }

  @Get('new')
  @Render(GeneratePage, { jsonApi: false })
  async generateForm(@Query() query: Record<string, unknown>) {
    const contour = asString(query.contour, 'test-stand');
    const type =
      asString(query.documentType, DOCUMENT_TYPE).trim() || DOCUMENT_TYPE;
    const profileVersionId = asString(query.profileVersionId);
    const fields = await this.loadConstraintFields(
      type,
      contour,
      profileVersionId,
    );
    const arrays = new Set(
      fields.schemaPaths
        .filter((item) => item.pathClass === 'array')
        .map((item) => item.path),
    );
    const arrayPaths = normalizeArrayPaths(query.arrayPath).filter((path) =>
      arrays.has(path),
    );
    const draftArrayPath = asString(query.draftArrayPath);
    const addCandidate = asString(query.confirmAddArrayPath)
      ? asString(query.confirmAddArrayPath)
      : asString(query.confirmAddFromDraft)
        ? draftArrayPath
        : '';
    const normalizedAdd = normalizeArrayPaths(addCandidate)[0] ?? '';
    let reason = asString(query.reason) || null;
    let confirmAddArrayPath: string | null = null;
    if (normalizedAdd) {
      if (!arrays.has(normalizedAdd)) {
        reason = 'array_path_invalid';
      } else if (!arrayPaths.includes(normalizedAdd)) {
        confirmAddArrayPath = normalizedAdd;
      }
    }
    const confirmRemove = asString(query.confirmRemoveArrayPath);
    const confirmRemoveArrayPath =
      confirmRemove && arrayPaths.includes(confirmRemove)
        ? confirmRemove
        : null;
    const constraintValues: Record<string, string> = {};
    for (const field of fields.constraintFields) {
      const value = asString(query[`constraint.${field.path}`]);
      if (value) {
        constraintValues[field.path] = value;
      }
    }
    return {
      contour,
      documentType: type,
      reason,
      seed: asString(query.seed, 'stand-24') || 'stand-24',
      count: asString(query.count, '100') || '100',
      targetIndex:
        asString(query.targetIndex, 'documents-synthetic') ||
        'documents-synthetic',
      profileVersionId: fields.profileVersionId,
      profileVersions: await this.listVersionOptions(type, contour),
      timeZone: contourTimeZone(contour),
      schemaPaths: fields.schemaPaths,
      idempotencyKey: asString(query.idempotencyKey) || randomUUID(),
      arrayPaths,
      draftArrayPath,
      confirmAddArrayPath,
      confirmRemoveArrayPath,
      confirmStart: Boolean(asString(query.confirmStart)),
      constraintValues,
      head: { title: 'Генерация' },
    };
  }

  @Post()
  async create(@Body() body: Record<string, unknown>, @Res() res: Response) {
    const contour = asString(body.contour, 'test-stand');
    const documentType =
      asString(body.documentType, DOCUMENT_TYPE).trim() || DOCUMENT_TYPE;
    const profileVersionId = asString(body.profileVersionId);
    const fields = await this.loadConstraintFields(
      documentType,
      contour,
      profileVersionId,
    );
    const fieldConstraints = parseConstraintForm(body, fields.constraintFields);
    const arrayPaths = normalizeArrayPaths(body.arrayPath);
    const payload = {
      documentType,
      contour,
      seed: asString(body.seed),
      count: Number(asString(body.count)),
      targetIndex: asString(body.targetIndex),
      profileVersionId: profileVersionId || undefined,
      fieldConstraints:
        fieldConstraints.length > 0 ? fieldConstraints : undefined,
      arrayPaths: arrayPaths.length > 0 ? arrayPaths : undefined,
    };
    try {
      const result = await this.startGenerate.execute({
        ...payload,
        idempotencyKey: asString(body.idempotencyKey),
        bodyHash: hashGenerateBody(payload),
      });
      res.redirect(
        303,
        withToast(`/jobs/${result.job.jobId}`, 'generate_started'),
      );
    } catch (error) {
      const failed = new URLSearchParams({
        contour,
        documentType,
        reason: reasonOf(error),
        seed: asString(body.seed),
        count: asString(body.count),
        targetIndex: asString(body.targetIndex),
      });
      if (profileVersionId) {
        failed.set('profileVersionId', profileVersionId);
      }
      arrayPaths.forEach((path) => failed.append('arrayPath', path));
      res.redirect(303, `/jobs/new?${failed.toString()}`);
    }
  }

  @Get(':jobId/confirm/cancel')
  @Render(JobPage, { jsonApi: false })
  async confirmCancel(
    @Param('jobId') jobId: string,
    @Query('reason') reason: string | null = null,
  ) {
    return {
      ...(await this.buildJobPage(jobId, undefined, reason)),
      confirm: 'cancel' as const,
    };
  }

  @Get(':jobId/confirm/publish')
  @Render(JobPage, { jsonApi: false })
  async confirmPublish(
    @Param('jobId') jobId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const page = await this.buildJobPage(
      jobId,
      undefined,
      asString(query.reason) || null,
    );
    const targetIndex =
      asString(query.targetIndex) || page.job.targetIndex || '';
    return {
      ...page,
      confirm: 'publish' as const,
      job: { ...page.job, targetIndex },
    };
  }

  @Get(':jobId/data')
  @Render(JobPage, { jsonApi: false })
  jobData(
    @Param('jobId') jobId: string,
    @Query('reason') reason: string | null = null,
  ) {
    return this.buildJobPage(jobId, 'data', reason);
  }

  @Get(':jobId')
  @Render(JobPage, { jsonApi: false })
  jobCard(
    @Param('jobId') jobId: string,
    @Query('view') view?: string,
    @Query('reason') reason: string | null = null,
  ) {
    return this.buildJobPage(jobId, view, reason);
  }

  @Post(':jobId/publish')
  async publish(
    @Param('jobId') jobId: string,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const targetIndex = asString(body.targetIndex);
    try {
      await this.publishJob.execute(jobId, { targetIndex });
      res.redirect(303, withToast(`/jobs/${jobId}`, 'published'));
    } catch (error) {
      const failed = new URLSearchParams({
        reason: reasonOf(error),
      });
      if (targetIndex) {
        failed.set('targetIndex', targetIndex);
      }
      res.redirect(303, `/jobs/${jobId}/confirm/publish?${failed.toString()}`);
    }
  }

  @Get(':jobId/status')
  @Render(JobStatus, { jsonApi: false })
  async jobStatus(@Param('jobId') jobId: string) {
    const job = await this.getJob.execute(jobId);
    return {
      job: {
        jobId: job.jobId,
        state: job.state,
        reason: job.reason,
        aliasHref: await this.trainAliasHref(job),
      },
    };
  }

  @Post(':jobId/cancel')
  async cancel(@Param('jobId') jobId: string, @Res() res: Response) {
    try {
      await this.cancelJob.execute(jobId);
      res.redirect(303, withToast(`/jobs/${jobId}`, 'cancelled'));
    } catch (error) {
      res.redirect(
        303,
        `/jobs/${jobId}?reason=${encodeURIComponent(reasonOf(error))}`,
      );
    }
  }

  @Get(':jobId/quarantine')
  @Render(QuarantinePage, { jsonApi: false })
  async quarantine(@Param('jobId') jobId: string) {
    const result = await this.getQuarantine.execute(jobId);
    return { jobId, items: result.items, head: { title: `Карантин ${jobId}` } };
  }

  private async buildJobPage(
    jobId: string,
    view?: string,
    reason: string | null = null,
  ) {
    const job = await this.getJob.execute(jobId);
    const drafts = await this.getJobDrafts.execute(jobId);
    const viewData = view === 'data' && job.kind === 'generate';
    return {
      job: {
        jobId: job.jobId,
        kind: job.kind,
        state: job.state,
        reason: job.reason ?? reason,
        documentType: job.documentType,
        contour: job.contour,
        profileVersionId: job.profileVersionId,
        profileVersionLabel: await this.versionLabelOf(
          job.documentType,
          job.contour,
          job.profileVersionId,
        ),
        publishedCount: job.publishedCount,
        quarantineCount: job.quarantineCount,
        requestedCount: job.requestedCount,
        fieldConstraints: job.fieldConstraints ?? [],
        targetIndex: job.targetIndex ?? 'documents-synthetic',
      },
      viewData,
      draftCount: drafts.length,
      documents: viewData
        ? drafts.map((document, index) => ({
            id: document.id,
            status: asPlainString(document.body.status),
            messageType: asPlainString(document.body.messageType),
            creationDateTime: asPlainString(document.body.creationDateTime),
            bodyJson:
              index < DRAFT_JSON_PREVIEW_LIMIT
                ? JSON.stringify(document.body)
                : '',
          }))
        : [],
      aliasHref: await this.trainAliasHref(job),
      head: { title: `Задание ${jobId}` },
    };
  }

  private async versionLabelOf(
    documentType: string,
    contour: string,
    versionId: string | null,
  ): Promise<string | null> {
    if (!versionId) {
      return null;
    }
    try {
      return (
        (
          await this.listProfileVersions.execute(documentType, contour)
        ).items.find((item) => item.versionId === versionId)?.label ?? null
      );
    } catch {
      return null;
    }
  }

  private async trainAliasHref(job: {
    kind: string;
    documentType: string;
    contour: string;
    jobId: string;
    profileVersionId: string | null;
  }): Promise<string | null> {
    if (job.kind !== 'train') {
      return null;
    }
    if (
      await this.versionLabelOf(
        job.documentType,
        job.contour,
        job.profileVersionId,
      )
    ) {
      return null;
    }
    return documentTypesHref(job.contour, {
      open: job.documentType,
      nameJob: job.jobId,
    });
  }

  private async listVersionOptions(
    documentType: string,
    contour: string,
  ): Promise<
    Array<{ versionId: string; label: string | null; active: boolean }>
  > {
    try {
      return (
        await this.listProfileVersions.execute(documentType, contour)
      ).items.map((item) => ({
        versionId: item.versionId,
        label: item.label,
        createdAt: item.createdAt,
        active: item.active,
      }));
    } catch {
      return [];
    }
  }

  private async loadConstraintFields(
    documentType: string,
    contour: string,
    profileVersionId: string,
  ): Promise<{
    profileVersionId: string;
    constraintFields: ConstraintField[];
    schemaPaths: Array<{
      path: string;
      pathClass: string;
      datetimeFormat?: string;
      categoryValues?: string[];
      itemPathClass?: string;
      itemDatetimeFormat?: string;
      itemCategoryValues?: string[];
      typeVariants?: string[];
      nullRate?: number;
    }>;
  }> {
    try {
      const listed = await this.listProfileVersions.execute(
        documentType,
        contour,
      );
      const versionId =
        profileVersionId ||
        listed.items.find((item) => item.active)?.versionId ||
        '';
      if (!versionId) {
        return { profileVersionId: '', constraintFields: [], schemaPaths: [] };
      }
      const version = await this.getProfileVersion.execute(
        documentType,
        contour,
        versionId,
      );
      return {
        profileVersionId: versionId,
        constraintFields: constraintFieldsFromProfile(version.paths),
        schemaPaths: version.paths.map((item) => ({
          path: item.path,
          pathClass: item.pathClass,
          datetimeFormat: item.datetimeFormat,
          categoryValues: item.categoryValues,
          itemPathClass: item.itemPathClass,
          itemDatetimeFormat: item.itemDatetimeFormat,
          itemCategoryValues: item.itemCategoryValues,
          typeVariants: item.typeVariants,
          nullRate: item.nullRate,
        })),
      };
    } catch {
      return {
        profileVersionId: profileVersionId || '',
        constraintFields: [],
        schemaPaths: [],
      };
    }
  }
}
