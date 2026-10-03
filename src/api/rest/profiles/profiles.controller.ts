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
import { ActivateProfileHandler } from '@use-cases/commands/activate-profile/activate-profile.handler';
import { RollbackProfileHandler } from '@use-cases/commands/rollback-profile/rollback-profile.handler';
import {
  StartTrainingHandler,
  hashBody,
} from '@use-cases/commands/start-training/start-training.handler';
import { ListProfileVersionsHandler } from '@use-cases/queries/list-profile-versions/list-profile-versions.handler';
import { GetProfileVersionHandler } from '@use-cases/queries/get-profile-version/get-profile-version.handler';
import { GetProfileDiffHandler } from '@use-cases/queries/get-profile-diff/get-profile-diff.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { ApiBearerGuard } from '../api-bearer.guard';
import {
  ActivateProfileDto,
  RollbackProfileDto,
} from '../dtos/activate-profile.dto';
import { StartTrainingDto } from '../dtos/start-training.dto';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(ApiBearerGuard)
@Controller('api/v1/profiles')
export class ProfilesController {
  constructor(
    private readonly startTraining: StartTrainingHandler,
    private readonly activateProfile: ActivateProfileHandler,
    private readonly rollbackProfile: RollbackProfileHandler,
    private readonly listVersionsQuery: ListProfileVersionsHandler,
    private readonly getVersionQuery: GetProfileVersionHandler,
    private readonly getDiffQuery: GetProfileDiffHandler,
  ) {}

  @Post(':documentType/trainings')
  async startTrainingRoute(
    @Param('documentType') documentType: string,
    @Body() body: StartTrainingDto,
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
    const result = await this.startTraining.execute({
      documentType,
      contour: body.contour,
      documents: body.documents,
      sampleSize: body.sampleSize,
      aliases: body.aliases ?? [],
      idempotencyKey,
      bodyHash: hashBody(body),
    });
    res.status(result.replayed ? 200 : 202);
    return result.job;
  }

  @Get(':documentType/versions')
  listVersions(
    @Param('documentType') documentType: string,
    @Query('contour') contour: string,
  ) {
    return this.listVersionsQuery.execute(documentType, contour);
  }

  @Get(':documentType/versions/:versionId')
  getVersion(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Query('contour') contour: string,
  ) {
    return this.getVersionQuery.execute(documentType, contour, versionId);
  }

  @Get(':documentType/versions/:versionId/diff')
  getDiff(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Query('contour') contour: string,
    @Query('against') against?: string,
  ) {
    return this.getDiffQuery.execute(documentType, contour, versionId, against);
  }

  @Post(':documentType/versions/:versionId/activate')
  activate(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Body() body: ActivateProfileDto,
  ) {
    return this.activateProfile.execute({
      documentType,
      contour: body.contour,
      versionId,
    });
  }

  @Post(':documentType/rollback')
  rollback(
    @Param('documentType') documentType: string,
    @Body() body: RollbackProfileDto,
  ) {
    return this.rollbackProfile.execute({
      documentType,
      contour: body.contour,
      versionId: body.versionId,
    });
  }
}
