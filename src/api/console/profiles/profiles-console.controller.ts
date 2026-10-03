import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { Layout, Render } from '@nestjs-ssr/react';
import { ConsoleLayout } from '@views/layout';
import { TrainPage } from '@frontend/pages/train/views/train-page';
import { VersionPage } from '@frontend/pages/version/views/version-page';
import {
  StartTrainingHandler,
  hashBody,
} from '@use-cases/commands/start-training/start-training.handler';
import { ActivateProfileHandler } from '@use-cases/commands/activate-profile/activate-profile.handler';
import { RollbackProfileHandler } from '@use-cases/commands/rollback-profile/rollback-profile.handler';
import { ListProfileVersionsHandler } from '@use-cases/queries/list-profile-versions/list-profile-versions.handler';
import { GetProfileVersionHandler } from '@use-cases/queries/get-profile-version/get-profile-version.handler';
import { AddProfileEnumValueHandler } from '@use-cases/commands/add-profile-enum-value/add-profile-enum-value.handler';
import { SaveProfileSchemaEditsHandler } from '@use-cases/commands/save-profile-schema-edits/save-profile-schema-edits.handler';
import { SetProfileVersionLabelHandler } from '@use-cases/commands/set-profile-version-label/set-profile-version-label.handler';
import { DeleteProfileVersionHandler } from '@use-cases/commands/delete-profile-version/delete-profile-version.handler';
import { GetProfileDiffHandler } from '@use-cases/queries/get-profile-diff/get-profile-diff.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { contourTimeZone } from '@entities/config/service-config';
import { parseLinkForm } from '@entities/profile/parse-link-form';
import { profileLinksOf } from '@entities/profile/profile-links';
import { ConsoleSessionGuard } from '../console-session.guard';
import { ConsoleJsonGuard } from '../console-json.guard';
import {
  readUploadedCorpus,
  type UploadedCorpusFile,
} from './read-uploaded-corpus';
import { withToast } from '../with-toast';
import { ListDocumentTypesHandler } from '@use-cases/queries/list-document-types/list-document-types.handler';
import { documentTypesHref } from '../document-types/document-types-href';

const reasonOf = (error: unknown): string => {
  if (error instanceof DomainHttpException) {
    return (error.getResponse() as { reason: string }).reason;
  }
  throw error;
};

@Controller('profiles')
@Layout(ConsoleLayout)
@UseGuards(ConsoleSessionGuard, ConsoleJsonGuard)
export class ProfilesConsoleController {
  constructor(
    private readonly startTraining: StartTrainingHandler,
    private readonly activateProfile: ActivateProfileHandler,
    private readonly rollbackProfile: RollbackProfileHandler,
    private readonly listVersions: ListProfileVersionsHandler,
    private readonly getVersion: GetProfileVersionHandler,
    private readonly getDiff: GetProfileDiffHandler,
    private readonly addEnumValue: AddProfileEnumValueHandler,
    private readonly saveSchemaEdits: SaveProfileSchemaEditsHandler,
    private readonly setVersionLabel: SetProfileVersionLabelHandler,
    private readonly deleteVersion: DeleteProfileVersionHandler,
    private readonly listDocumentTypes: ListDocumentTypesHandler,
  ) {}

  @Get(':documentType')
  @Render(TrainPage, { jsonApi: false })
  async trainForm(
    @Param('documentType') documentType: string,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
    @Query('sampleSize') sampleSize = '100',
  ) {
    const catalog = (await this.listDocumentTypes.execute(contour)).items;
    const documentTypes = (
      catalog.some((item) => item.documentType === documentType)
        ? catalog
        : [
            {
              documentType,
              versions: [],
              activeVersionId: null,
              activeVersionLabel: null,
            },
            ...catalog,
          ]
    ).map((item) => ({ documentType: item.documentType, enabled: true }));
    return {
      documentType,
      contour,
      reason,
      sampleSize,
      idempotencyKey: randomUUID(),
      documentTypes,
      head: { title: `Обучение — ${documentType}` },
    };
  }

  @Get(':documentType/versions')
  versionsList(
    @Param('documentType') documentType: string,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
    @Query('confirmDelete') confirmDelete: string | null = null,
    @Query('confirmActivate') confirmActivate: string | null = null,
    @Query('nameVersion') nameVersion: string | null = null,
    @Query('nameJob') nameJob: string | null = null,
    @Res() res: Response,
  ) {
    res.redirect(
      303,
      documentTypesHref(contour, {
        open: documentType,
        reason,
        confirmDeleteVersion: confirmDelete,
        confirmActivate,
        nameVersion,
        nameJob,
      }),
    );
  }

  @Post(':documentType/trainings')
  @UseInterceptors(
    FilesInterceptor('corpus', 10, {
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async postTraining(
    @Param('documentType') documentType: string,
    @UploadedFiles() files: UploadedCorpusFile[] | undefined,
    @Body()
    body: {
      contour: string;
      sampleSize: string;
      idempotencyKey: string;
      aliasFrom?: string;
      aliasTo?: string;
    },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    const sampleSize = body.sampleSize || '100';
    const fail = (reason: string) => {
      res.redirect(
        303,
        `/profiles/${documentType}?contour=${encodeURIComponent(contour)}&reason=${encodeURIComponent(reason)}&sampleSize=${encodeURIComponent(sampleSize)}`,
      );
    };
    const aliases =
      body.aliasFrom && body.aliasTo
        ? [{ from: body.aliasFrom, to: body.aliasTo }]
        : [];
    const parsed = readUploadedCorpus(files);
    if (!parsed.ok) {
      fail(parsed.reason);
      return;
    }
    try {
      const result = await this.startTraining.execute({
        documentType,
        contour,
        documents: parsed.documents,
        sampleSize: Number(sampleSize),
        aliases,
        idempotencyKey: body.idempotencyKey,
        bodyHash: hashBody({
          contour,
          sampleSize: Number(sampleSize),
          aliases,
          documents: parsed.documents,
        }),
      });
      res.redirect(
        303,
        withToast(
          documentTypesHref(contour, {
            open: documentType,
            nameJob: result.job.jobId,
          }),
          'training_started',
        ),
      );
    } catch (error) {
      fail(reasonOf(error));
    }
  }

  @Get(':documentType/versions/:versionId/confirm/activate')
  @Render(VersionPage, { jsonApi: false })
  async confirmActivate(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
  ) {
    return {
      ...(await this.buildVersionPage(
        documentType,
        versionId,
        contour,
        reason,
      )),
      confirm: 'activate' as const,
    };
  }

  @Get(':documentType/versions/:versionId/confirm/rollback')
  @Render(VersionPage, { jsonApi: false })
  async confirmRollback(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
  ) {
    return {
      ...(await this.buildVersionPage(
        documentType,
        versionId,
        contour,
        reason,
      )),
      confirm: 'rollback' as const,
    };
  }

  @Get(':documentType/versions/:versionId')
  @Render(VersionPage, { jsonApi: false })
  versionCard(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Query('contour') contour = 'test-stand',
    @Query('reason') reason: string | null = null,
    @Query('editEnum') editEnum: string | null = null,
  ) {
    return this.buildVersionPage(
      documentType,
      versionId,
      contour,
      reason,
      editEnum,
    );
  }

  @Post(':documentType/versions/:versionId/schema')
  async saveVersionSchema(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Body() body: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    const sourceHref = `/profiles/${documentType}/versions/${versionId}?contour=${encodeURIComponent(contour)}`;
    const pathClassByPath: Record<string, string> = {};
    const pathNameByPath: Record<string, string> = {};
    const enumAdded: Record<string, string[]> = {};
    const skipDraft = (path: string): boolean => path.startsWith('__');
    for (const [key, raw] of Object.entries(body)) {
      if (key.startsWith('pathClass:')) {
        const path = key.slice('pathClass:'.length);
        if (!skipDraft(path)) {
          pathClassByPath[path] = raw ?? '';
        }
      }
      if (key.startsWith('pathName:')) {
        const path = key.slice('pathName:'.length);
        if (!skipDraft(path) && (raw ?? '').trim()) {
          pathNameByPath[path] = raw ?? '';
        }
      }
      if (key.startsWith('enumAdded:')) {
        const path = key.slice('enumAdded:'.length);
        const values = (raw ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (values.length > 0 && !skipDraft(path)) {
          enumAdded[path] = values;
        }
      }
    }
    try {
      const current = await this.getVersion.execute(
        documentType,
        contour,
        versionId,
      );
      const allowedPaths = new Set([
        ...current.paths.map((item) => item.path),
        ...Object.values(pathNameByPath),
      ]);
      const hasLinkFields = Object.keys(body).some((key) =>
        key.startsWith('linkKind:'),
      );
      const result = await this.saveSchemaEdits.execute({
        documentType,
        contour,
        versionId,
        pathClassByPath,
        pathNameByPath,
        enumAdded,
        links: hasLinkFields ? parseLinkForm(body, allowedPaths) : undefined,
        activate: body.activate === '1',
        createdAt: new Date().toISOString(),
      });
      const cardHref = `/profiles/${documentType}/versions/${result.versionId}?contour=${encodeURIComponent(contour)}`;
      const toast = result.activated
        ? 'schema_saved_activated'
        : 'schema_saved';
      const next = result.activateReason
        ? `${cardHref}&reason=${encodeURIComponent(result.activateReason)}`
        : withToast(cardHref, toast);
      res.redirect(303, next);
    } catch (error) {
      res.redirect(
        303,
        `${sourceHref}&reason=${encodeURIComponent(reasonOf(error))}`,
      );
    }
  }

  @Post(':documentType/versions/:versionId/enums')
  async addEnumValueToVersion(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Body() body: { contour?: string; path?: string; value?: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    const path = body.path ?? '';
    const versionHref = `/profiles/${documentType}/versions/${versionId}?contour=${encodeURIComponent(contour)}&editEnum=${encodeURIComponent(path)}`;
    try {
      await this.addEnumValue.execute({
        documentType,
        contour,
        versionId,
        path,
        value: body.value ?? '',
      });
      res.redirect(303, withToast(versionHref, 'enum_added'));
    } catch (error) {
      res.redirect(
        303,
        `${versionHref}&reason=${encodeURIComponent(reasonOf(error))}`,
      );
    }
  }

  @Post(':documentType/versions/:versionId/alias')
  async saveVersionAlias(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Body() body: { contour?: string; label?: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    const listHref = documentTypesHref(contour, { open: documentType });
    try {
      await this.setVersionLabel.execute({
        documentType,
        contour,
        versionId,
        label: body.label ?? '',
      });
      res.redirect(303, withToast(listHref, 'alias_saved'));
    } catch (error) {
      res.redirect(
        303,
        documentTypesHref(contour, {
          open: documentType,
          nameVersion: versionId,
          reason: reasonOf(error),
        }),
      );
    }
  }

  @Post(':documentType/versions/:versionId/delete')
  async deleteVersionFromList(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Body() body: { contour?: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    const listHref = documentTypesHref(contour, { open: documentType });
    try {
      await this.deleteVersion.execute({ documentType, contour, versionId });
      res.redirect(303, withToast(listHref, 'version_deleted'));
    } catch (error) {
      res.redirect(
        303,
        documentTypesHref(contour, {
          open: documentType,
          reason: reasonOf(error),
        }),
      );
    }
  }

  @Post(':documentType/versions/:versionId/activate')
  async activateVersion(
    @Param('documentType') documentType: string,
    @Param('versionId') versionId: string,
    @Body() body: { contour: string; returnTo?: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    const listHref = documentTypesHref(contour, { open: documentType });
    const cardHref = `/profiles/${documentType}/versions/${versionId}?contour=${encodeURIComponent(contour)}`;
    const doneHref =
      body.returnTo === 'list' || body.returnTo === 'types'
        ? listHref
        : cardHref;
    try {
      await this.activateProfile.execute({ documentType, contour, versionId });
      res.redirect(303, withToast(doneHref, 'activated'));
    } catch (error) {
      res.redirect(
        303,
        `${doneHref}&reason=${encodeURIComponent(reasonOf(error))}`,
      );
    }
  }

  @Post(':documentType/rollback')
  async rollbackVersion(
    @Param('documentType') documentType: string,
    @Body() body: { contour: string; versionId: string },
    @Res() res: Response,
  ) {
    const contour = body.contour || 'test-stand';
    try {
      const result = await this.rollbackProfile.execute({
        documentType,
        contour,
        versionId: body.versionId,
      });
      res.redirect(
        303,
        withToast(
          `/profiles/${documentType}/versions/${result.activeVersionId}?contour=${encodeURIComponent(contour)}`,
          'rolled_back',
        ),
      );
    } catch (error) {
      res.redirect(
        303,
        `/profiles/${documentType}/versions/${body.versionId}?contour=${encodeURIComponent(contour)}&reason=${encodeURIComponent(reasonOf(error))}`,
      );
    }
  }

  private async buildVersionPage(
    documentType: string,
    versionId: string,
    contour: string,
    reason: string | null,
    editEnum: string | null = null,
  ) {
    const version = await this.getVersion.execute(
      documentType,
      contour,
      versionId,
    );
    const diff = await this.getDiff.execute(documentType, contour, versionId);
    const editEnumPath =
      editEnum &&
      version.paths.some(
        (item) => item.path === editEnum && item.pathClass === 'category',
      )
        ? editEnum
        : null;
    return {
      documentType,
      contour,
      timeZone: contourTimeZone(contour),
      versionId,
      createdAt: version.createdAt,
      reason,
      editEnumPath,
      activeVersionId:
        (await this.listVersions.execute(documentType, contour)).items.find(
          (item) => item.active,
        )?.versionId ?? null,
      rejectedPathCount: version.paths.filter(
        (item) => item.pathClass === 'rejected',
      ).length,
      paths: version.paths.map((item) => ({
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
      ...profileLinksOf(version),
      diff,
      head: { title: `Версия ${versionId}` },
    };
  }
}
