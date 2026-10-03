import type { ListDocumentTypesHandler } from '@use-cases/queries/list-document-types/list-document-types.handler';

export const DEFAULT_CONSOLE_CONTOUR = 'test-stand';

export type ConsoleActiveVersionItem = {
  documentType: string;
  activeVersionId: string | null;
  activeVersionLabel: string | null;
};

export type ConsoleActiveVersions = {
  contour: string;
  items: ConsoleActiveVersionItem[];
};

export const allowedContourNamesFromEnv = (): string[] =>
  (process.env.ALLOWED_CONTOURS ?? '')
    .split(',')
    .map((entry) => entry.trim().split(':')[0])
    .filter((item): item is string => Boolean(item));

export const readContourQuery = (
  query: Record<string, unknown> | undefined,
): string => {
  const value = query?.contour;
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0];
  }
  return DEFAULT_CONSOLE_CONTOUR;
};

type CatalogReader = {
  execute: (contour: string) =>
    | {
        items: Array<{
          documentType: string;
          activeVersionId: string | null;
          activeVersionLabel: string | null;
        }>;
      }
    | Promise<{
        items: Array<{
          documentType: string;
          activeVersionId: string | null;
          activeVersionLabel: string | null;
        }>;
      }>;
};

export const createConsoleSsrContext = (
  listTypes: CatalogReader | ListDocumentTypesHandler,
) => {
  return async (params: { req: { query?: Record<string, unknown> } }) => {
    const contour = readContourQuery(params.req.query);
    try {
      const listed = await listTypes.execute(contour);
      const activeVersions: ConsoleActiveVersions = {
        contour,
        items: listed.items.map((item) => ({
          documentType: item.documentType,
          activeVersionId: item.activeVersionId,
          activeVersionLabel: item.activeVersionLabel,
        })),
      };
      return { activeVersions, allowedContours: allowedContourNamesFromEnv() };
    } catch {
      return {
        activeVersions: { contour, items: [] },
        allowedContours: allowedContourNamesFromEnv(),
      };
    }
  };
};
