import { readFile } from 'fs/promises';
import { ClusterPort } from '../opensearch/cluster.port';
import { TEST_INDEX_MAPPINGS } from '../indexes/index-mapping';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const seedReferenceIndex = async (
  cluster: ClusterPort,
  index: string,
  filePath: string,
): Promise<number> => {
  if (!filePath) {
    return 0;
  }
  const raw = await readFile(filePath, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  const documents = Array.isArray(parsed) ? parsed.filter(isPlainObject) : isPlainObject(parsed) ? [parsed] : [];
  await cluster.createIndex(index, TEST_INDEX_MAPPINGS);
  const batchSize = 200;
  for (let i = 0; i < documents.length; i += batchSize) {
    const slice = documents.slice(i, i + batchSize).map((body, offset) => ({
      id: String(body.id ?? `ref-${i + offset}`),
      body,
    }));
    await cluster.bulkUpsert(index, slice);
  }
  await cluster.refresh(index);
  return documents.length;
};
