export type ContourConfig = {
  contour: string;
  timeZone: string;
};

export type ServiceConfig = {
  allowedContours: ContourConfig[];
  minSampleSize: number;
  canaryBatchSize: number;
  poisonRatioThreshold: number;
  maxCategoryCardinality: number;
  presenceDropThreshold: number;
  shortWindowThreshold: number;
  prodContourNames: string[];
  enabledDocumentTypes: Array<{ documentType: string; enabled: boolean }>;
};

export const loadServiceConfig = (): ServiceConfig => {
  const raw = process.env.ALLOWED_CONTOURS ?? '';
  const allowedContours = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [contour, timeZone] = entry.split(':');
      return { contour, timeZone: timeZone ?? 'UTC' };
    });
  return {
    allowedContours,
    minSampleSize: Number(process.env.MIN_SAMPLE_SIZE ?? 10),
    canaryBatchSize: Number(process.env.CANARY_BATCH_SIZE ?? 100),
    poisonRatioThreshold: Number(process.env.POISON_RATIO_THRESHOLD ?? 0.1),
    maxCategoryCardinality: Number(process.env.MAX_CATEGORY_CARDINALITY ?? 32),
    presenceDropThreshold: Number(process.env.PRESENCE_DROP_THRESHOLD ?? 0.05),
    shortWindowThreshold: Number(process.env.SHORT_WINDOW_THRESHOLD ?? 10),
    prodContourNames: (process.env.PROD_CONTOURS ?? 'prod')
      .split(',')
      .map((s) => s.trim()),
    enabledDocumentTypes: (process.env.ENABLED_DOCUMENT_TYPES ?? 'document')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((documentType) => ({ documentType, enabled: true })),
  };
};

export const isContourAllowed = (
  config: ServiceConfig,
  contour: string,
): boolean => config.allowedContours.some((item) => item.contour === contour);

export const contourTimeZone = (
  contour: string,
  config = loadServiceConfig(),
): string =>
  config.allowedContours.find((item) => item.contour === contour)?.timeZone ??
  'UTC';
