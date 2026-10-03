import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { loadServiceConfig } from '@entities/config/service-config';
import { diffProfiles } from '@entities/profile/diff-profile';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

@Injectable()
export class GetProfileDiffHandler {
  private readonly config = loadServiceConfig();

  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    documentType: string,
    contour: string,
    versionId: string,
    against?: string,
  ) {
    if (!contour) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Нужен query contour',
        '',
      );
    }
    const to = await this.store.getProfile(documentType, contour, versionId);
    if (!to) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Версия не найдена',
        '',
      );
    }
    const fromId =
      against ?? (await this.store.getActiveVersionId(documentType, contour));
    const from = fromId
      ? ((await this.store.getProfile(documentType, contour, fromId)) ?? null)
      : null;
    return diffProfiles(from, to, {
      shortWindowThreshold: this.config.shortWindowThreshold,
      presenceDropThreshold: this.config.presenceDropThreshold,
    });
  }
}
