import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { applyEnumExtras } from '@entities/profile/enum-extras';
import { profileLinksOf } from '@entities/profile/profile-links';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

@Injectable()
export class GetProfileVersionHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(documentType: string, contour: string, versionId: string) {
    if (!contour) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Нужен query contour',
        '',
      );
    }
    const stored = await this.store.getProfile(
      documentType,
      contour,
      versionId,
    );
    if (!stored) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Версия не найдена',
        '',
      );
    }
    const version = applyEnumExtras(
      stored,
      await this.store.getEnumExtras(documentType, contour, versionId),
    );
    return {
      versionId: version.versionId,
      documentType: version.documentType,
      contour: version.contour,
      createdAt: version.createdAt,
      paths: version.paths.map((item) => ({
        path: item.path,
        pathClass: item.pathClass,
        presenceRate: item.presenceRate,
        missingKeyRate: item.missingKeyRate,
        nullRate: item.nullRate,
        categoryValues: item.categoryValues,
        datetimeFormat: item.datetimeFormat,
        itemPathClass: item.itemPathClass,
        itemDatetimeFormat: item.itemDatetimeFormat,
        itemCategoryValues: item.itemCategoryValues,
        typeVariants: item.typeVariants,
      })),
      mappingIndex: version.mappingIndex,
      sampleDocumentCount: version.sampleDocumentCount,
      activatable: version.activatable,
      ...profileLinksOf(version),
    };
  }
}
