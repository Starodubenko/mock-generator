import { validateFieldConstraints } from './validate-field-constraints';
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
    {
      path: 'creationDateTime',
      pathClass: 'datetime',
      presenceRate: 1,
      nullRate: 0,
      emptyStringRate: 0,
      emptyArrayRate: 0,
      emptyObjectRate: 0,
      cardinality: 1,
      missingKeyRate: 0,
      datetimeFormat: 'date-time',
    },
  ],
};

describe('validateFieldConstraints', () => {
  it('should_accept_empty_constraints', () => {
    expect(
      validateFieldConstraints(
        [],
        version,
        '2026-09-24T21:00:00+03:00',
        'Europe/Moscow',
      ),
    ).toEqual({
      ok: true,
      constraints: [],
    });
  });

  it('should_accept_known_enum_boolean_and_same_day', () => {
    const result = validateFieldConstraints(
      [
        { path: 'status', kind: 'category', values: ['NEW'] },
        { path: 'priority', kind: 'boolean', values: [true] },
        { path: 'docDate', kind: 'datetime', values: ['2026-09-24'] },
      ],
      version,
      '2026-09-24T21:00:00+03:00',
      'Europe/Moscow',
    );
    expect(result.ok).toBe(true);
  });

  it('should_reject_unknown_path', () => {
    const result = validateFieldConstraints(
      [{ path: 'missing', kind: 'category', values: ['NEW'] }],
      version,
      '2026-09-24T21:00:00+03:00',
      'Europe/Moscow',
    );
    expect(result).toEqual({ ok: false, reason: 'validation_error' });
  });

  it('should_reject_enum_outside_profile', () => {
    const result = validateFieldConstraints(
      [{ path: 'status', kind: 'category', values: ['CLOSED'] }],
      version,
      '2026-09-24T21:00:00+03:00',
      'Europe/Moscow',
    );
    expect(result).toEqual({ ok: false, reason: 'validation_error' });
  });

  it('should_reject_datetime_on_another_day', () => {
    const result = validateFieldConstraints(
      [{ path: 'docDate', kind: 'datetime', values: ['2026-09-25'] }],
      version,
      '2026-09-24T21:00:00+03:00',
      'Europe/Moscow',
    );
    expect(result).toEqual({ ok: false, reason: 'validation_error' });
  });
});
