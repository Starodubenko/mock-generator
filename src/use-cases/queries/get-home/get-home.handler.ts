import { Injectable } from '@nestjs/common';
import { loadServiceConfig } from '@entities/config/service-config';
import { ListDocumentTypesHandler } from '../list-document-types/list-document-types.handler';

@Injectable()
export class GetHomeHandler {
  constructor(private readonly listDocumentTypes: ListDocumentTypesHandler) {}

  async execute(contour: string) {
    const config = loadServiceConfig();
    const types = (await this.listDocumentTypes.execute(contour)).items;
    return {
      contours: config.allowedContours,
      documentTypes: types.map((item) => ({
        documentType: item.documentType,
        activeVersionId: item.activeVersionId,
        activeVersionLabel: item.activeVersionLabel,
      })),
      contour,
    };
  }
}
