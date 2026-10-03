import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { mergeCategoryValues } from '@entities/profile/enum-extras';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type AddProfileEnumValueCommand = {
  documentType: string;
  contour: string;
  versionId: string;
  path: string;
  value: string;
};

export type AddProfileEnumValueResult = {
  documentType: string;
  contour: string;
  versionId: string;
  path: string;
  value: string;
};

@Injectable()
export class AddProfileEnumValueHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    command: AddProfileEnumValueCommand,
  ): Promise<AddProfileEnumValueResult> {
    const value = command.value.trim();
    if (!command.path || !value) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Нужны путь и значение enum',
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
    const stats = version.paths.find((item) => item.path === command.path);
    if (!stats || stats.pathClass !== 'category') {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Путь не является enum',
        '',
      );
    }
    const extras = await this.store.getEnumExtras(
      command.documentType,
      command.contour,
      command.versionId,
    );
    const current = mergeCategoryValues(
      stats.categoryValues,
      extras[command.path],
    );
    if (!current.includes(value)) {
      await this.store.addEnumExtra(
        command.documentType,
        command.contour,
        command.versionId,
        command.path,
        value,
      );
    }
    return {
      documentType: command.documentType,
      contour: command.contour,
      versionId: command.versionId,
      path: command.path,
      value,
    };
  }
}
