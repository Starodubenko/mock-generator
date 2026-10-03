import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type DeleteProfileVersionCommand = {
  documentType: string;
  contour: string;
  versionId: string;
};

@Injectable()
export class DeleteProfileVersionHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    command: DeleteProfileVersionCommand,
  ): Promise<{ versionId: string }> {
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
    const active = await this.store.getActiveVersionId(
      command.documentType,
      command.contour,
    );
    if (active === command.versionId) {
      throw new DomainHttpException(
        422,
        'validation_error',
        'Нельзя удалить рабочую версию контура',
        '',
      );
    }
    await this.store.deleteProfile(
      command.documentType,
      command.contour,
      command.versionId,
    );
    return { versionId: command.versionId };
  }
}
