import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { sortProfileVersionsByCreatedAt } from '@entities/profile/sort-profile-versions';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

@Injectable()
export class ListProfileVersionsHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(documentType: string, contour: string) {
    if (!contour) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Нужен query contour',
        '',
      );
    }
    const active = await this.store.getActiveVersionId(documentType, contour);
    const profiles = await this.store.listProfiles(documentType, contour);
    const items = [];
    for (const version of profiles) {
      items.push({
        versionId: version.versionId,
        label:
          (await this.store.getVersionLabel(
            documentType,
            contour,
            version.versionId,
          )) ?? null,
        contour: version.contour,
        createdAt: version.createdAt,
        active: active === version.versionId,
        activatable: version.activatable,
        rejectedPathCount: version.paths.filter(
          (item) => item.pathClass === 'rejected',
        ).length,
        snapshotId: version.snapshotId,
      });
    }
    return { items: sortProfileVersionsByCreatedAt(items), nextCursor: null };
  }
}
