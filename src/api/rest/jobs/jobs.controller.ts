import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  StartGenerateHandler,
  hashGenerateBody,
} from '@use-cases/commands/start-generate/start-generate.handler';
import { PublishJobHandler } from '@use-cases/commands/publish-job/publish-job.handler';
import { CancelJobHandler } from '@use-cases/commands/cancel-job/cancel-job.handler';
import { GetJobHandler } from '@use-cases/queries/get-job/get-job.handler';
import { ListJobsHandler } from '@use-cases/queries/list-jobs/list-jobs.handler';
import { GetQuarantineHandler } from '@use-cases/queries/get-quarantine/get-quarantine.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { ApiBearerGuard } from '../api-bearer.guard';
import { asFieldConstraints } from '@entities/job/field-constraint';
import { CreateJobDto } from '../dtos/create-job.dto';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(ApiBearerGuard)
@Controller('api/v1/jobs')
export class JobsController {
  constructor(
    private readonly startGenerate: StartGenerateHandler,
    private readonly publishJob: PublishJobHandler,
    private readonly cancelJob: CancelJobHandler,
    private readonly getJob: GetJobHandler,
    private readonly listJobsQuery: ListJobsHandler,
    private readonly getQuarantine: GetQuarantineHandler,
  ) {}

  @Post()
  async createJob(
    @Body() body: CreateJobDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!idempotencyKey) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Нужен заголовок Idempotency-Key',
        '',
      );
    }
    const result = await this.startGenerate.execute({
      documentType: body.documentType,
      contour: body.contour,
      profileVersionId: body.profileVersionId,
      jobId: body.jobId,
      seed: body.seed,
      count: body.count,
      targetIndex: body.targetIndex,
      generatedAt: body.generatedAt,
      fieldConstraints: asFieldConstraints(body.fieldConstraints),
      arrayPaths: body.arrayPaths,
      idempotencyKey,
      bodyHash: hashGenerateBody({
        documentType: body.documentType,
        contour: body.contour,
        profileVersionId: body.profileVersionId,
        jobId: body.jobId,
        seed: body.seed,
        count: body.count,
        targetIndex: body.targetIndex,
        generatedAt: body.generatedAt,
        fieldConstraints: asFieldConstraints(body.fieldConstraints),
        arrayPaths: body.arrayPaths,
      }),
    });
    res.status(result.replayed ? 200 : 202);
    return result.job;
  }

  @Get(':jobId')
  getJobById(@Param('jobId') jobId: string) {
    return this.getJob.execute(jobId);
  }

  @Get()
  listJobs(
    @Query('contour') contour?: string,
    @Query('kind') kind?: string,
    @Query('state') state?: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.listJobsQuery.execute({ contour, kind, state, documentType });
  }

  @Post(':jobId/publish')
  publish(@Param('jobId') jobId: string) {
    return this.publishJob.execute(jobId);
  }

  @Post(':jobId/cancel')
  cancel(@Param('jobId') jobId: string) {
    return this.cancelJob.execute(jobId);
  }

  @Get(':jobId/quarantine')
  quarantine(@Param('jobId') jobId: string) {
    return this.getQuarantine.execute(jobId);
  }
}
