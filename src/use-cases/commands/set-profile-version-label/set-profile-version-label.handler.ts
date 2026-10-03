import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export const VERSION_LABEL_MAX_LENGTH = 80;

export type SetProfileVersionLabelCommand = {
  documentType: string;
  contour: string;
  versionId: string;
  label: string;
};

@Injectable()
export class SetProfileVersionLabelHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    command: SetProfileVersionLabelCommand,
  ): Promise<{ versionId: string; label: string }> {
    const label = command.label.trim();
    if (!label || label.length > VERSION_LABEL_MAX_LENGTH) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Нужен текстовый алиас версии',
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
    await this.store.setVersionLabel(
      command.documentType,
      command.contour,
      command.versionId,
      label,
    );
    return { versionId: command.versionId, label };
  }
}
