import {
  applySchemaEdits,
  SchemaEditConflictError,
  schemaEditContentId,
} from './apply-schema-edits';
import type { PathStats, ProfileVersion } from './profile.types';

const version = (overrides: Partial<ProfileVersion> = {}): ProfileVersion => ({
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: false,
  paths: [
    {
      path: 'status',
      pathClass: 'rejected',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 2,
      missingKeyRate: 0,
      categoryValues: ['NEW'],
    },
  ],
  ...overrides,
});

describe('applySchemaEdits', () => {
  it('should_resolve_rejected_by_explicit_type_and_rehash', () => {
    const source = version();
    const next = applySchemaEdits({
      version: source,
      overrides: [{ path: 'status', pathClass: 'category' }],
      enumAdded: { status: ['ERROR'] },
      createdAt: '2026-02-01T00:00:00Z',
      minSampleSize: 10,
    });
    expect(source.paths[0]?.pathClass).toBe('rejected');
    expect(next.versionId).not.toBe(source.versionId);
    expect(next.paths[0]?.pathClass).toBe('category');
    expect(next.paths[0]?.categoryValues).toEqual(['NEW', 'ERROR']);
    expect(next.activatable).toBe(true);
    expect(next.createdAt).toBe('2026-02-01T00:00:00Z');
    expect(schemaEditContentId(next)).toBe(next.versionId);
  });

  it('should_keep_version_not_activatable_below_min_sample', () => {
    const next = applySchemaEdits({
      version: version({ sampleDocumentCount: 2 }),
      overrides: [{ path: 'status', pathClass: 'boolean' }],
      createdAt: '2026-02-01T00:00:00Z',
      minSampleSize: 10,
    });
    expect(next.paths[0]?.pathClass).toBe('boolean');
    expect(next.paths[0]?.categoryValues).toBeUndefined();
    expect(next.activatable).toBe(false);
  });

  it('should_rename_path_and_record_alias', () => {
    const source = version();
    const next = applySchemaEdits({
      version: source,
      overrides: [],
      names: { status: 'state' },
      createdAt: '2026-02-01T00:00:00Z',
      minSampleSize: 10,
    });
    expect(next.paths[0]?.path).toBe('state');
    expect(next.aliases).toEqual([{ from: 'status', to: 'state' }]);
    expect(next.versionId).not.toBe(source.versionId);
  });

  it('should_add_new_field_and_missing_parent', () => {
    const next = applySchemaEdits({
      version: version(),
      overrides: [{ path: 'meta.flag', pathClass: 'boolean' }],
      createdAt: '2026-02-01T00:00:00Z',
      minSampleSize: 10,
    });
    expect(next.paths.map((item) => item.path)).toEqual([
      'meta',
      'meta.flag',
      'status',
    ]);
    expect(next.paths.find((item) => item.path === 'meta')?.pathClass).toBe(
      'nested',
    );
    expect(
      next.paths.find((item) => item.path === 'meta.flag')?.pathClass,
    ).toBe('boolean');
  });

  it('should_keep_array_item_type_on_explicit_policy', () => {
    const next = applySchemaEdits({
      version: version({
        paths: [
          {
            path: 'tags',
            pathClass: 'array',
            presenceRate: 1,
            nullRate: 0,
            emptyStringRate: 0,
            emptyArrayRate: 0,
            emptyObjectRate: 0,
            cardinality: 1,
            missingKeyRate: 0,
            itemPathClass: 'free-text',
          },
        ],
      }),
      overrides: [
        { path: 'tags', pathClass: 'array', itemPathClass: 'category' },
      ],
      enumAdded: { tags: ['NEW'] },
      createdAt: '2026-02-01T00:00:00Z',
      minSampleSize: 10,
    });
    expect(next.paths[0]?.pathClass).toBe('array');
    expect(next.paths[0]?.itemPathClass).toBe('category');
    expect(next.paths[0]?.itemCategoryValues).toEqual(['NEW']);
  });

  it('should_reject_name_collision', () => {
    const extra: PathStats = {
      path: 'state',
      pathClass: 'free-text',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
    };
    expect(() =>
      applySchemaEdits({
        version: version({ paths: [...version().paths, extra] }),
        overrides: [],
        names: { status: 'state' },
        createdAt: '2026-02-01T00:00:00Z',
        minSampleSize: 10,
      }),
    ).toThrow(SchemaEditConflictError);
  });
});
