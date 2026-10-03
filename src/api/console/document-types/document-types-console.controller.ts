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
import { Layout, Render } from '@nestjs-ssr/react';
import { ConsoleLayout } from '@views/layout';
import { DocumentTypesPage } from '@frontend/pages/document-types/views/document-types-page';
import { AddDocumentTypeHandler } from '@use-cases/commands/add-document-type/add-document-type.handler';
import { DeleteDocumentTypeHandler } from '@use-cases/commands/delete-document-type/delete-document-type.handler';
import { ListDocumentTypesHandler } from '@use-cases/queries/list-document-types/list-document-types.handler';
import { GetJobHandler } from '@use-cases/queries/get-job/get-job.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { ConsoleSessionGuard } from '../console-session.guard';
import { ConsoleJsonGuard } from '../console-json.guard';
import { withToast } from '../with-toast';
import { documentTypesHref } from './document-types-href';
import { contourTimeZone } from '@entities/config/service-config';
import { resolveTrainAliasPrompt } from './resolve-train-alias-prompt';

const reasonOf = (error: unknown): string => {
  if (error instanceof DomainHttpException) {
    return (error.getResponse() as { reason: string }).reason;
  }
  throw error;
};

@Controller('document-types')
@Layout(ConsoleLayout)
@UseGuards(ConsoleSessionGuard, ConsoleJsonGuard)
export class DocumentTypesConsoleController {
  constructor(
    private readonly listTypes: ListDocumentTypesHandler,
    private readonly addType: AddDocumentTypeHandler,
    private readonly deleteType: DeleteDocumentTypeHandler,
    private readonly getJob: GetJobHandler,
  ) {}

  @Get()
  @Render(DocumentTypesPage, { jsonApi: false })
  list(
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
    @Query('open') open: string | null = null,
    @Query('confirmDeleteType') confirmDeleteType: string | null = null,
    @Query('confirmDeleteVersion') confirmDeleteVersion: string | null = null,
    @Query('confirmActivate') confirmActivate: string | null = null,
    @Query('nameVersion') nameVersion: string | null = null,
    @Query('nameJob') nameJob: string | null = null,
    @Query('addType') addType: string | null = null,
  ) {
    return this.buildPage(
      contour,
      reason,
      open,
      confirmDeleteType,
      confirmDeleteVersion,
      confirmActivate,
      nameVersion,
      nameJob,
      addType,
    );
  }

  @Post()
  async add(
    @Body() body: { contour?: string; documentType?: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    try {
      const result = await this.addType.execute({
        documentType: body.documentType ?? '',
      });
      res.redirect(
        303,
        withToast(
          documentTypesHref(contour, { open: result.documentType }),
          'type_added',
        ),
      );
    } catch (error) {
      res.redirect(
        303,
        documentTypesHref(contour, { reason: reasonOf(error), addType: '1' }),
      );
    }
  }

  @Post(':documentType/delete')
  async remove(
    @Param('documentType') documentType: string,
    @Body() body: { contour?: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    try {
      await this.deleteType.execute({ documentType });
      res.redirect(303, withToast(documentTypesHref(contour), 'type_deleted'));
    } catch (error) {
      res.redirect(
        303,
        documentTypesHref(contour, { reason: reasonOf(error) }),
      );
    }
  }

  private async buildPage(
    contour: string,
    reason: string | null,
    open: string | null,
    confirmDeleteType: string | null,
    confirmDeleteVersion: string | null,
    confirmActivate: string | null,
    nameVersion: string | null,
    nameJob: string | null,
    addTypeQuery: string | null,
  ) {
    const types = (await this.listTypes.execute(contour)).items;
    const known = types.some((item) => item.documentType === open)
      ? open
      : (types[0]?.documentType ?? null);
    const opened = types.find((item) => item.documentType === known);
    let job = null;
    if (nameJob) {
      try {
        job = await this.getJob.execute(nameJob);
      } catch {
        job = null;
      }
    }
    const prompt = resolveTrainAliasPrompt({
      queryNameVersion: nameVersion,
      openType: known,
      contour,
      versions: opened?.versions ?? [],
      job,
    });
    const resolvedName = prompt.nameVersion;
    const pendingHref =
      prompt.pending && known
        ? documentTypesHref(contour, { open: known, nameJob })
        : null;
    const deleteType =
      confirmDeleteType &&
      types.some((item) => item.documentType === confirmDeleteType)
        ? confirmDeleteType
        : null;
    const deleteVersion =
      confirmDeleteVersion &&
      opened?.versions.some(
        (item) => item.versionId === confirmDeleteVersion && !item.active,
      )
        ? confirmDeleteVersion
        : null;
    const activate =
      confirmActivate &&
      opened?.versions.some(
        (item) =>
          item.versionId === confirmActivate &&
          !item.active &&
          item.activatable,
      )
        ? confirmActivate
        : null;
    const aliasTarget = resolvedName;
    const addType =
      (addTypeQuery === '1' || addTypeQuery === 'true') &&
      !deleteType &&
      !deleteVersion &&
      !activate &&
      !aliasTarget;
    return {
      contour,
      reason,
      types,
      openType: known,
      confirmDeleteType: deleteType,
      confirmDeleteVersion: deleteVersion,
      confirmActivate: activate,
      nameVersion: aliasTarget,
      pendingHref,
      addType,
      timeZone: contourTimeZone(contour),
      head: { title: `Типы — ${contour}` },
    };
  }
}
