import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  applySchemaEdits,
  SchemaEditConflictError,
  schemaEditContentId,
} from '@entities/profile/apply-schema-edits';
import { applyEnumExtras } from '@entities/profile/enum-extras';
import { parsePathClassSelectValue } from '@entities/profile/parse-path-class-select';
import type { ProfileLinkFields } from '@entities/profile/profile-links';
import { loadServiceConfig } from '@entities/config/service-config';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';
import { ActivateProfileHandler } from '../activate-profile/activate-profile.handler';

export type SaveProfileSchemaEditsCommand = {
  documentType: string;
  contour: string;
  versionId: string;
  pathClassByPath: Record<string, string>;
  pathNameByPath?: Record<string, string>;
  enumAdded?: Record<string, string[]>;
  links?: ProfileLinkFields;
  activate: boolean;
  createdAt: string;
};

export type SaveProfileSchemaEditsResult = {
  versionId: string;
  created: boolean;
  activated: boolean;
  activateReason: string | null;
};

@Injectable()
export class SaveProfileSchemaEditsHandler {
  private readonly config = loadServiceConfig();

  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
    private readonly activateProfile: ActivateProfileHandler,
  ) {}

  async execute(
    command: SaveProfileSchemaEditsCommand,
  ): Promise<SaveProfileSchemaEditsResult> {
    const stored = await this.store.getProfile(
      command.documentType,
      command.contour,
      command.versionId,
    );
    if (!stored) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Версия не найдена',
        '',
      );
    }
    const displayed = applyEnumExtras(
      stored,
      await this.store.getEnumExtras(
        command.documentType,
        command.contour,
        command.versionId,
      ),
    );
    const overrides = Object.entries(command.pathClassByPath)
      .map(([path, value]) => {
        const parsed = parsePathClassSelectValue(value);
        return parsed ? { path, ...parsed } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    let next: ReturnType<typeof applySchemaEdits>;
    try {
      next = applySchemaEdits({
        version: displayed,
        overrides,
        enumAdded: command.enumAdded,
        names: command.pathNameByPath,
        links: command.links,
        createdAt: command.createdAt,
        minSampleSize: this.config.minSampleSize,
      });
    } catch (error) {
      if (error instanceof SchemaEditConflictError) {
        throw new DomainHttpException(
          400,
          'validation_error',
          error.message,
          '',
        );
      }
      throw error;
    }
    const unchanged =
      schemaEditContentId(next) === schemaEditContentId(displayed);
    if (!unchanged) {
      await this.store.saveProfile(next);
    }
    const versionId = unchanged ? stored.versionId : next.versionId;
    if (!command.activate) {
      return {
        versionId,
        created: !unchanged,
        activated: false,
        activateReason: null,
      };
    }
    try {
      await this.activateProfile.execute({
        documentType: command.documentType,
        contour: command.contour,
        versionId,
      });
      return {
        versionId,
        created: !unchanged,
        activated: true,
        activateReason: null,
      };
    } catch (error) {
      if (error instanceof DomainHttpException) {
        return {
          versionId,
          created: !unchanged,
          activated: false,
          activateReason: (error.getResponse() as { reason: string }).reason,
        };
      }
      throw error;
    }
  }
}
