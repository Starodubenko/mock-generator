import { formatProfileVersionLabel } from '@frontend/shared/i18n/profile-version-label';
import { formatDocumentType } from '@frontend/shared/i18n/ru-labels';
import {
  ACTIVE_VERSION_NONE,
  type ActiveVersionCatalog,
  type ActiveVersionSnapshot,
} from './compare-active-versions';

export const mapCatalogToSnapshot = (
  catalog: ActiveVersionCatalog,
): ActiveVersionSnapshot => ({
  contour: catalog.contour,
  ready: catalog.ready,
  items: catalog.items.map((item) => ({
    documentType: item.documentType,
    title: formatDocumentType(item.documentType),
    versionId: item.activeVersionId,
    caption: item.activeVersionId
      ? formatProfileVersionLabel({
          versionId: item.activeVersionId,
          label: item.activeVersionLabel,
        })
      : ACTIVE_VERSION_NONE,
  })),
});
