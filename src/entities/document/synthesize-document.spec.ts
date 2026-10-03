import { LinkOutsideJobError, synthesizeDocument } from './synthesize-document';
import { buildProfile } from '../profile/build-profile';
import type { PathStats, ProfileVersion } from '../profile/profile.types';

const stats = (
  path: string,
  pathClass: PathStats['pathClass'],
  extra: Partial<PathStats> = {},
): PathStats => ({
  path,
  pathClass,
  presenceRate: 1,
  nullRate: 0,
  emptyStringRate: 0,
  emptyArrayRate: 0,
  emptyObjectRate: 0,
  cardinality: 1,
  missingKeyRate: 0,
  ...extra,
});

const baseVersion: ProfileVersion = {
  versionId: 'abcd',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit-1',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(['secret-note']),
  sampleDocumentCount: 2,
  activatable: true,
  paths: [
    stats('id', 'identifier'),
    {
      path: 'status',
      pathClass: 'category',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 2,
      missingKeyRate: 0,
      categoryValues: ['NEW', 'ERROR'],
    },
    {
      path: 'comment',
      pathClass: 'free-text',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 100,
      missingKeyRate: 0,
    },
  ],
};

describe('synthesizeDocument', () => {
  it('should_return_the_same_bytes_for_the_same_input', () => {
    const input = {
      version: baseVersion,
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    };
    const first = JSON.stringify(synthesizeDocument(input));
    const second = JSON.stringify(synthesizeDocument(input));
    expect(first).toBe(second);
  });

  it('should_use_different_ids_for_different_job_ids', () => {
    const common = {
      version: baseVersion,
      seed: 's1',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    };
    const a = synthesizeDocument({ ...common, jobId: 'job-a' });
    const b = synthesizeDocument({ ...common, jobId: 'job-b' });
    expect(a.id).not.toBe(b.id);
  });

  it('should_reject_link_outside_job', () => {
    expect(() =>
      synthesizeDocument({
        version: baseVersion,
        seed: 's1',
        jobId: 'job-aaaa',
        number: 1,
        generatedAt: '2026-09-24T21:00:00+03:00',
        zone: 'Europe/Moscow',
        linkedDocumentId: 'other-job-id',
      }),
    ).toThrow(LinkOutsideJobError);
  });

  it('should_reuse_category_values_even_if_they_appear_in_corpus', () => {
    const document = synthesizeDocument({
      version: {
        ...baseVersion,
        corpusValueFingerprints: new Set(['NEW', 'ERROR', 'secret-note']),
      },
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(['NEW', 'ERROR']).toContain(document.status);
    expect(String(document.comment)).not.toContain('secret-note');
  });

  it('should_not_copy_corpus_fingerprint_into_comment', () => {
    const document = synthesizeDocument({
      version: baseVersion,
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(String(document.comment)).not.toContain('secret-note');
  });

  it('should_write_boolean_and_date_only_from_generatedAt', () => {
    const document = synthesizeDocument({
      version: {
        ...baseVersion,
        paths: [
          ...baseVersion.paths,
          {
            path: 'priority',
            pathClass: 'boolean',
            presenceRate: 1,
            nullRate: 0,
            emptyStringRate: 0,
            emptyArrayRate: 0,
            emptyObjectRate: 0,
            cardinality: 2,
            missingKeyRate: 0,
          },
          {
            path: 'docDate',
            pathClass: 'datetime',
            presenceRate: 1,
            nullRate: 0,
            emptyStringRate: 0,
            emptyArrayRate: 0,
            emptyObjectRate: 0,
            cardinality: 1,
            missingKeyRate: 0,
            datetimeFormat: 'date',
          },
        ],
      },
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(typeof document.priority).toBe('boolean');
    expect(document.docDate).toBe('2026-09-24');
  });

  it('should_emit_object_array_with_item_fields', () => {
    const document = synthesizeDocument({
      version: {
        ...baseVersion,
        paths: [
          ...baseVersion.paths,
          {
            path: 'markers',
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
            path: 'markers.code',
            pathClass: 'category',
            presenceRate: 1,
            nullRate: 0,
            emptyStringRate: 0,
            emptyArrayRate: 0,
            emptyObjectRate: 0,
            cardinality: 2,
            missingKeyRate: 0,
            categoryValues: ['IN', 'OUT'],
          },
          {
            path: 'markers.active',
            pathClass: 'boolean',
            presenceRate: 1,
            nullRate: 0,
            emptyStringRate: 0,
            emptyArrayRate: 0,
            emptyObjectRate: 0,
            cardinality: 2,
            missingKeyRate: 0,
          },
        ],
      },
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(Array.isArray(document.markers)).toBe(true);
    const [marker] = document.markers as Record<string, unknown>[];
    expect(['IN', 'OUT']).toContain(marker.code);
    expect(typeof marker.active).toBe('boolean');
  });

  it('should_honor_allow_list_for_status_and_boolean', () => {
    const documents = [1, 2, 3].map((number) =>
      synthesizeDocument({
        version: {
          ...baseVersion,
          paths: [
            ...baseVersion.paths,
            {
              path: 'priority',
              pathClass: 'boolean',
              presenceRate: 1,
              nullRate: 0,
              emptyStringRate: 0,
              emptyArrayRate: 0,
              emptyObjectRate: 0,
              cardinality: 2,
              missingKeyRate: 0,
            },
          ],
        },
        seed: 's1',
        jobId: 'job-a',
        number,
        generatedAt: '2026-09-24T21:00:00+03:00',
        zone: 'Europe/Moscow',
        constraints: [
          { path: 'status', kind: 'category', values: ['NEW'] },
          { path: 'priority', kind: 'boolean', values: [true] },
        ],
      }),
    );
    expect(documents.every((item) => item.status === 'NEW')).toBe(true);
    expect(documents.every((item) => item.priority === true)).toBe(true);
  });

  it('should_keep_parent_child_and_item_linked_ids_aligned', () => {
    const version: ProfileVersion = {
      ...baseVersion,
      identifierPaths: ['id', 'childItems.id'],
      parentChildInvariants: [
        {
          parentPath: 'id',
          childPath: 'linkSections.entityId',
          arrayPath: 'childItems',
        },
      ],
      valueEqualities: [
        {
          scope: 'array-item',
          arrayPath: 'childItems',
          paths: [
            'childItems.id',
            'childItems.linkSections.linkedId',
          ],
        },
      ],
      paths: [
        ...baseVersion.paths,
        {
          path: 'childItems',
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
          path: 'childItems.id',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'childItems.linkSections',
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
          path: 'childItems.linkSections.entityId',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'childItems.linkSections.linkedId',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
      ],
    };
    const document = synthesizeDocument({
      version,
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    const children = document.childItems as Record<
      string,
      unknown
    >[];
    const child = children[0] as Record<string, unknown>;
    const link = child.linkSections as Record<string, unknown>;
    expect(link.entityId).toBe(document.id);
    expect(child.id).toBe(link.linkedId);
    expect(child.id).not.toBe(document.id);
  });

  it('should_keep_local_section_id_off_item_linked_id', () => {
    const version: ProfileVersion = {
      ...baseVersion,
      identifierPaths: [
        'id',
        'childItems.id',
        'childItems.documentSection.id',
      ],
      valueEqualities: [
        {
          scope: 'array-item',
          arrayPath: 'childItems',
          paths: [
            'childItems.id',
            'childItems.commonSection.linkedId',
          ],
        },
        {
          scope: 'array-item',
          arrayPath: 'childItems',
          paths: [
            'childItems.documentSection.id',
            'childItems.originalDocumentSection.id',
          ],
        },
      ],
      paths: [
        ...baseVersion.paths,
        {
          path: 'childItems',
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
          path: 'childItems.id',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'childItems.commonSection',
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
          path: 'childItems.commonSection.linkedId',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'childItems.documentSection',
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
          path: 'childItems.documentSection.id',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
        {
          path: 'childItems.originalDocumentSection',
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
          path: 'childItems.originalDocumentSection.id',
          pathClass: 'identifier',
          presenceRate: 1,
          nullRate: 0,
          emptyStringRate: 0,
          emptyArrayRate: 0,
          emptyObjectRate: 0,
          cardinality: 1,
          missingKeyRate: 0,
        },
      ],
    };
    const document = synthesizeDocument({
      version,
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    const child = (
      document.childItems as Record<string, unknown>[]
    )[0] as Record<string, unknown>;
    const common = child.commonSection as Record<string, unknown>;
    const section = child.documentSection as Record<string, unknown>;
    const original = child.originalDocumentSection as Record<string, unknown>;
    expect(child.id).toBe(common.linkedId);
    expect(section.id).toBe(original.id);
    expect(section.id).not.toBe(child.id);
    expect(section.id).not.toBe(document.id);
  });

  it('should_emit_empty_array_when_training_only_had_empty_arrays', () => {
    const document = synthesizeDocument({
      version: {
        ...baseVersion,
        paths: [
          ...baseVersion.paths,
          stats('checkInSections', 'array', {
            emptyArrayRate: 1,
            itemPathClass: 'free-text',
          }),
        ],
      },
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(document.checkInSections).toEqual([]);
  });

  it('should_not_add_root_fields_missing_from_the_trained_profile', () => {
    const document = synthesizeDocument({
      version: {
        ...baseVersion,
        paths: [stats('createdAt', 'datetime', { datetimeFormat: 'date-time' })],
      },
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(document.creationDateTime).toBeUndefined();
    expect(document.status).toBeUndefined();
    expect(document.messageType).toBeUndefined();
    expect(typeof document.createdAt).toBe('string');
  });

  it('should_keep_equal_dates_as_dates_not_job_ids', () => {
    const document = synthesizeDocument({
      version: {
        ...baseVersion,
        dateShiftPaths: [
          'childItems.partitionDate',
          'childItems.docDate',
        ],
        valueEqualities: [
          {
            scope: 'array-item',
            arrayPath: 'childItems',
            paths: [
              'childItems.partitionDate',
              'childItems.docDate',
            ],
          },
        ],
        paths: [
          ...baseVersion.paths,
          stats('childItems', 'array', {
            itemPathClass: 'nested',
          }),
          stats('childItems.partitionDate', 'datetime', {
            datetimeFormat: 'date',
          }),
          stats('childItems.docDate', 'datetime', {
            datetimeFormat: 'date',
          }),
        ],
      },
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-24T21:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    const child = (
      document.childItems as Record<string, unknown>[]
    )[0];
    expect(child.partitionDate).toBe('2026-09-24');
    expect(child.docDate).toBe('2026-09-24');
    expect(String(child.partitionDate)).not.toMatch(/^job-/);
  });

  it('should_repeat_parent_wrapper_shape_from_training_corpus', () => {
    const built = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-parent',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        {
          id: 'parent-a',
          createdAt: '2026-09-24T12:00:00+03:00',
          updatedAt: '2026-09-24T12:00:00+03:00',
          partitionDate: '2026-09-24',
          childItems: [
            {
              id: 'child-a',
              entityId: null,
              linkedId: null,
              partitionDate: '2026-09-24',
              checkInSections: [],
              documentSection: {
                id: 'doc-a',
                partitionDate: '2026-09-24',
                docDate: '2026-09-24',
                valueDate: '2026-09-24',
              },
            },
          ],
        },
        {
          id: 'parent-b',
          createdAt: '2026-09-25T12:00:00+03:00',
          updatedAt: '2026-09-25T12:00:00+03:00',
          partitionDate: '2026-09-25',
          childItems: [
            {
              id: 'child-b',
              entityId: null,
              linkedId: null,
              partitionDate: '2026-09-25',
              checkInSections: [],
              documentSection: {
                id: 'doc-b',
                partitionDate: '2026-09-25',
                docDate: '2026-09-25',
                valueDate: '2026-09-25',
              },
            },
          ],
        },
      ],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const document = synthesizeDocument({
      version: built.version,
      seed: 's1',
      jobId: 'job-a',
      number: 1,
      generatedAt: '2026-09-29T22:00:00+03:00',
      zone: 'Europe/Moscow',
    });
    expect(Object.keys(document).sort()).toEqual([
      'childItems',
      'createdAt',
      'id',
      'partitionDate',
      'updatedAt',
    ]);
    const child = (
      document.childItems as Record<string, unknown>[]
    )[0];
    expect(child.checkInSections).toEqual([]);
    expect(child.entityId).toBeNull();
    expect(child.linkedId).toBeNull();
    const section = child.documentSection as Record<string, unknown>;
    expect(section.partitionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(section.docDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(section.valueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
