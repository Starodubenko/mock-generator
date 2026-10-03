import { Inject, Injectable } from '@nestjs/common';
import { ListProfileVersionsHandler } from '../list-profile-versions/list-profile-versions.handler';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type DocumentTypeCatalogItem = {
  documentType: string;
  versions: Array<{
    versionId: string;
    label: string | null;
    createdAt: string;
    active: boolean;
    activatable: boolean;
  }>;
  activeVersionId: string | null;
  activeVersionLabel: string | null;
};

@Injectable()
export class ListDocumentTypesHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
    private readonly listVersions: ListProfileVersionsHandler,
  ) {}

  async execute(
    contour: string,
  ): Promise<{ items: DocumentTypeCatalogItem[] }> {
    const catalog = await this.store.listDocumentTypes();
    const items: DocumentTypeCatalogItem[] = [];
    for (const item of catalog) {
      const listed = await this.listVersions.execute(
        item.documentType,
        contour,
      );
      const versions = listed.items.map((version) => ({
        versionId: version.versionId,
        label: version.label,
        createdAt: version.createdAt,
        active: version.active,
        activatable: version.activatable,
      }));
      const active = versions.find((version) => version.active);
      items.push({
        documentType: item.documentType,
        versions,
        activeVersionId: active?.versionId ?? null,
        activeVersionLabel: active?.label ?? null,
      });
    }
    return { items };
  }
}
