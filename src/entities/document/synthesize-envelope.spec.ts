import { synthesizeEnvelope } from './synthesize-envelope';
import type { ProfileVersion } from '../profile/profile.types';

const version: ProfileVersion = {
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 2,
  activatable: true,
  paths: [
    {
      path: 'took',
      pathClass: 'number-string',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    },
    {
      path: 'hits',
      pathClass: 'nested',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    },
    {
      path: 'hits.hits',
      pathClass: 'array',
      itemPathClass: 'nested',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    },
    {
      path: 'hits.hits._id',
      pathClass: 'identifier',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 2,
      missingKeyRate: 0,
    },
  ],
};

describe('synthesizeEnvelope', () => {
  it('should_keep_root_object_and_expand_only_listed_arrays', () => {
    const document = synthesizeEnvelope({
      version,
      seed: 's1',
      jobId: 'job-env',
      number: 1,
      count: 3,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
      arrayPaths: ['hits.hits'],
    });
    expect(Array.isArray(document)).toBe(false);
    expect(typeof document.took).toBe('number');
    const hits = (document.hits as { hits: Array<{ _id: string }> }).hits;
    expect(hits).toHaveLength(3);
    expect(new Set(hits.map((item) => item._id)).size).toBe(3);
  });
});
