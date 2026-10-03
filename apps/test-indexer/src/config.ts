export type IndexerConfig = {
  port: number;
  opensearchNode: string;
  serviceName: string;
  platformToken: string;
  prodContours: string[];
  syntheticSuffix: string;
  seedReferencePath: string;
  seedReferenceIndex: string;
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  seedDocumentTypes: string[];
};

export const loadIndexerConfig = (): IndexerConfig => ({
  port: Number(process.env.PORT ?? 3100),
  opensearchNode: process.env.OPENSEARCH_NODE ?? 'http://127.0.0.1:9200',
  serviceName: process.env.EXPECTED_SERVICE_NAME ?? 'synthetic-data-generator',
  platformToken: process.env.PLATFORM_SERVICE_TOKEN ?? '',
  prodContours: (process.env.PROD_CONTOURS ?? 'prod')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  syntheticSuffix: process.env.SYNTHETIC_INDEX_SUFFIX ?? '-synthetic',
  seedReferencePath: process.env.SEED_REFERENCE_PATH ?? '',
  seedReferenceIndex: process.env.SEED_REFERENCE_INDEX ?? 'documents-reference',
  postgres: {
    host: process.env.POSTGRES_HOST ?? '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT ?? 5434),
    user: process.env.POSTGRES_USER ?? 'indexer',
    password: process.env.POSTGRES_PASSWORD ?? 'indexer',
    database: process.env.POSTGRES_DB ?? 'indexer',
  },
  seedDocumentTypes: (process.env.SEED_DOCUMENT_TYPES ?? 'document')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
});

export const postgresUrl = (config: IndexerConfig): string => {
  const { user, password, host, port, database } = config.postgres;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

export const isProdContour = (config: IndexerConfig, contour: string): boolean =>
  config.prodContours.includes(contour) || contour.startsWith('prod-');

export const isSyntheticIndex = (config: IndexerConfig, index: string): boolean =>
  index.endsWith(config.syntheticSuffix);
