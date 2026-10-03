import { Inject, Injectable } from '@nestjs/common';
import {
  isContourAllowed,
  loadServiceConfig,
} from '@entities/config/service-config';
import { DomainHttpException } from '@app/domain-http.exception';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type ActivateProfileCommand = {
  documentType: string;
  contour: string;
  versionId: string;
  requirePreviouslyActive?: boolean;
};

export type ActivateProfileResult = {
  documentType: string;
  contour: string;
  activeVersionId: string;
  previousVersionId: string | null;
};

@Injectable()
export class ActivateProfileHandler {
  private readonly config = loadServiceConfig();

  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    command: ActivateProfileCommand,
  ): Promise<ActivateProfileResult> {
    if (
      this.config.allowedContours.length === 0 ||
      !isContourAllowed(this.config, command.contour)
    ) {
      throw new DomainHttpException(
        422,
        'prod_target',
        'Контур не в allow-list',
        '',
      );
    }
    const version = await this.store.getProfile(
      command.documentType,
      command.contour,
      command.versionId,
    );
    if (!version) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Версия не найдена',
        '',
      );
    }
    if (
      command.requirePreviouslyActive &&
      !(await this.store.wasActivated(
        command.documentType,
        command.contour,
        command.versionId,
      ))
    ) {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Версия раньше не активировалась',
        '',
      );
    }
    if (!version.activatable) {
      if (version.sampleDocumentCount < this.config.minSampleSize) {
        throw new DomainHttpException(
          422,
          'below_min_sample',
          'Выборка меньше минимума',
          '',
        );
      }
      throw new DomainHttpException(
        422,
        'type_conflict',
        'Версия не активируется',
        '',
      );
    }
    if (version.paths.some((item) => item.pathClass === 'rejected')) {
      throw new DomainHttpException(
        422,
        'type_conflict',
        'В версии есть отклонённые пути',
        '',
      );
    }
    const previous =
      (await this.store.getActiveVersionId(
        command.documentType,
        command.contour,
      )) ?? null;
    await this.store.setActiveVersionId(
      command.documentType,
      command.contour,
      command.versionId,
    );
    await this.store.appendActivation({
      documentType: command.documentType,
      contour: command.contour,
      versionId: command.versionId,
      previousVersionId: previous,
      activatedAt: new Date().toISOString(),
    });
    return {
      documentType: command.documentType,
      contour: command.contour,
      activeVersionId: command.versionId,
      previousVersionId: previous,
    };
  }
}
