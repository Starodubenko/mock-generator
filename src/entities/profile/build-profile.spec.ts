import { readFileSync } from 'fs';
import { join } from 'path';
import { buildProfile } from './build-profile';

const exampleFile = (name: string): string =>
  join(__dirname, 'fixtures', name);

const mixedTypes = JSON.parse(
  readFileSync(exampleFile('mixed-types.json'), 'utf8'),
) as Record<string, unknown>[];

describe('buildProfile', () => {
  it('should_return_empty_corpus_when_no_documents', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [],
      minSampleSize: 10,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result).toEqual({ ok: false, reason: 'empty_corpus' });
  });

  it('should_mark_mixed_types_path_as_rejected', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: mixedTypes,
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.version.paths.find((item) => item.path === 'field')?.pathClass,
      ).toBe('rejected');
      expect(result.version.activatable).toBe(false);
    }
  });

  it('should_fingerprint_only_long_free_text_and_identifiers', () => {
    const documents = Array.from({ length: 40 }, (_, index) => ({
      status: index % 2 === 0 ? 'NEW' : 'ERROR',
      comment: `secret-note-value-${index}`,
      score: String(index % 3),
    }));
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents,
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.version.corpusValueFingerprints.has('NEW')).toBe(false);
      expect(result.version.corpusValueFingerprints.has('0')).toBe(false);
      expect(
        result.version.corpusValueFingerprints.has('secret-note-value-0'),
      ).toBe(true);
    }
  });

  it('should_classify_id_suffix_as_identifier_and_high_cardinality_text_as_free_text', () => {
    const documents = Array.from({ length: 40 }, (_, index) => ({
      comment: `note-${index}`,
      externalId: `ext-${index}`,
    }));
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents,
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.version.paths.find((item) => item.path === 'comment')?.pathClass,
      ).toBe('free-text');
      expect(
        result.version.paths.find((item) => item.path === 'externalId')
          ?.pathClass,
      ).toBe('identifier');
    }
  });

  it('should_auto_classify_all_inferable_types_from_corpus_like_document', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        {
          id: 'ref-1',
          status: 'NEW',
          messageType: 'type-a',
          level: 'NORMAL',
          comment: 'long enough comment text one',
          externalId: 'ext-1',
          priority: true,
          enabled: false,
          docDate: '2026-09-24',
          itemDate: '2026-09-24',
          creationDateTime: '2026-09-24T08:00:00+03:00',
          modificationDateTime: '2026-09-24T08:00:30+03:00',
          nested: { code: 'type-a', flag: true, id: 101 },
          tags: ['a'],
        },
        {
          id: 'ref-2',
          status: 'ERROR',
          messageType: 'type-b',
          level: 'HIGH',
          comment: 'long enough comment text two',
          externalId: 'ext-2',
          priority: false,
          enabled: true,
          docDate: '2026-09-24',
          itemDate: '2026-09-24',
          creationDateTime: '2026-09-24T09:00:00+03:00',
          modificationDateTime: '2026-09-24T09:00:30+03:00',
          nested: { code: 'type-b', flag: false, id: 105 },
          tags: ['b'],
        },
      ],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const byPath = Object.fromEntries(
      result.version.paths.map((item) => [item.path, item]),
    );
    expect(byPath.id?.pathClass).toBe('identifier');
    expect(byPath.status?.pathClass).toBe('category');
    expect(byPath.messageType?.pathClass).toBe('category');
    expect(byPath.level?.pathClass).toBe('category');
    expect(byPath.comment?.pathClass).toBe('category');
    expect(byPath.externalId?.pathClass).toBe('identifier');
    expect(byPath.priority?.pathClass).toBe('boolean');
    expect(byPath.enabled?.pathClass).toBe('boolean');
    expect(byPath.docDate?.pathClass).toBe('datetime');
    expect(byPath.docDate?.datetimeFormat).toBe('date');
    expect(byPath.itemDate?.pathClass).toBe('datetime');
    expect(byPath.itemDate?.datetimeFormat).toBe('date');
    expect(byPath.creationDateTime?.pathClass).toBe('datetime');
    expect(byPath.creationDateTime?.datetimeFormat).toBe('date-time');
    expect(byPath.modificationDateTime?.pathClass).toBe('datetime');
    expect(byPath.nested?.pathClass).toBe('nested');
    expect(byPath['nested.flag']?.pathClass).toBe('boolean');
    expect(byPath['nested.id']?.pathClass).toBe('number-string');
    expect(byPath['nested.code']?.pathClass).toBe('category');
    expect(byPath.tags?.pathClass).toBe('array');
    expect(byPath.tags?.itemPathClass).toBe('category');
    expect(byPath.tags?.itemCategoryValues).toEqual(['a', 'b']);
  });

  it('should_collect_object_array_item_fields_as_child_paths', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        {
          markers: [
            { code: 'alpha', active: true },
            { code: 'beta', active: false },
          ],
        },
        { markers: [] },
        { markers: [{ code: 'gamma', active: true }] },
      ],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const byPath = Object.fromEntries(
      result.version.paths.map((item) => [item.path, item]),
    );
    expect(byPath.markers?.pathClass).toBe('array');
    expect(byPath.markers?.itemPathClass).toBe('nested');
    expect(byPath['markers.code']?.pathClass).toBe('category');
    expect(byPath['markers.code']?.categoryValues).toEqual([
      'alpha',
      'beta',
      'gamma',
    ]);
    expect(byPath['markers.active']?.pathClass).toBe('boolean');
    expect(byPath['markers.code']?.missingKeyRate).toBeCloseTo(1 / 3);
  });

  it('should_reject_mixed_date_and_datetime_on_the_same_path', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        { when: '2026-09-24' },
        { when: '2026-09-24T08:00:00+03:00' },
      ],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.version.paths.find((item) => item.path === 'when')?.pathClass,
      ).toBe('rejected');
      expect(
        result.version.paths.find((item) => item.path === 'when')?.typeVariants,
      ).toEqual(['date', 'date-time']);
    }
  });

  it('should_keep_category_when_values_include_null', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [{ status: 'NEW' }, { status: null }],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const status = result.version.paths.find((item) => item.path === 'status');
    expect(status?.pathClass).toBe('category');
    expect(status?.nullRate).toBeGreaterThan(0);
    expect(status?.typeVariants).toEqual(['string', 'null']);
  });

  it('should_discover_parent_child_and_item_id_equality', () => {
    const documents = JSON.parse(
      readFileSync(
        exampleFile('parent-child.json'),
        'utf8',
      ),
    ) as Record<string, unknown>[];
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents,
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(
      result.version.parentChildInvariants?.some(
        (item) =>
          item.parentPath === 'id' &&
          item.arrayPath === 'childItems' &&
          item.childPath === 'linkSections.entityId',
      ),
    ).toBe(true);
    expect(
      result.version.valueEqualities?.some((group) =>
        group.paths.includes(
          'childItems.commonSection.linkedId',
        ),
      ),
    ).toBe(true);
  });

  it('should_keep_opensearch_export_envelope_in_the_schema', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        {
          took: 14,
          timed_out: false,
          _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
          hits: {
            total: { value: 1, relation: 'eq' },
            max_score: 1,
            hits: [
              {
                _index: 'curr-parent',
                _id: 'parent-a',
                _score: 1,
                _source: {
                  id: 'parent-a',
                  createdAt: '2026-09-24T12:00:00+03:00',
                  childItems: [],
                },
              },
            ],
          },
        },
      ],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const names = result.version.paths.map((item) => item.path);
    expect(names).toEqual(
      expect.arrayContaining([
        'took',
        'timed_out',
        '_shards',
        '_shards.total',
        'hits',
        'hits.total',
        'hits.total.value',
        'hits.hits',
        'hits.hits._index',
        'hits.hits._id',
        'hits.hits._source',
        'hits.hits._source.id',
        'hits.hits._source.childItems',
      ]),
    );
    expect(result.version.sampleDocumentCount).toBe(1);
  });

  it('should_count_export_hits_toward_activatable_sample_size', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        {
          took: 1,
          hits: {
            hits: [
              { _source: { id: 'a', createdAt: '2026-01-01T00:00:00Z' } },
              { _source: { id: 'b', createdAt: '2026-01-02T00:00:00Z' } },
            ],
          },
        },
      ],
      minSampleSize: 2,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.version.sampleDocumentCount).toBe(2);
    expect(result.version.activatable).toBe(true);
  });

  it('should_keep_always_empty_arrays_without_inventing_item_class', () => {
    const result = buildProfile({
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit-1',
      mappingIndex: 'documents-synthetic',
      aliases: [],
      documents: [
        { id: 'a', checkInSections: [] },
        { id: 'b', checkInSections: [] },
      ],
      minSampleSize: 1,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const checkIn = result.version.paths.find(
      (item) => item.path === 'checkInSections',
    );
    expect(checkIn?.pathClass).toBe('array');
    expect(checkIn?.emptyArrayRate).toBe(1);
    expect(checkIn?.itemPathClass).toBeUndefined();
    expect(checkIn?.typeVariants).toEqual(['array']);
  });
});
