import {
  ACTIVE_VERSION_NONE,
  decideActiveVersionWatch,
  diffActiveVersions,
  parseCatalogPayload,
  parseStoredSnapshot,
  storageKeyForContour,
  toSafeJson,
  type ActiveVersionSnapshotItem,
} from './compare-active-versions';

const item = (
  documentType: string,
  versionId: string | null,
  extras?: Partial<ActiveVersionSnapshotItem>,
): ActiveVersionSnapshotItem => ({
  documentType,
  title: extras?.title ?? documentType,
  versionId,
  caption: extras?.caption ?? versionId ?? ACTIVE_VERSION_NONE,
});

describe('storageKeyForContour', () => {
  it('should_scope_key_by_contour', () => {
    expect(storageKeyForContour('test-stand')).toBe(
      'mock-generator:active-versions:test-stand',
    );
  });
});

describe('parseCatalogPayload', () => {
  it('should_fallback_when_payload_missing', () => {
    expect(parseCatalogPayload(undefined, 'test-stand')).toEqual({
      contour: 'test-stand',
      items: [],
      ready: false,
    });
  });

  it('should_keep_valid_items_only', () => {
    expect(
      parseCatalogPayload(
        {
          contour: 'dev',
          items: [
            {
              documentType: 'document',
              activeVersionId: 'abc',
              activeVersionLabel: 'стенд',
            },
            { documentType: '', activeVersionId: 'x' },
            { activeVersionId: 'y' },
          ],
        },
        'test-stand',
      ),
    ).toEqual({
      contour: 'dev',
      items: [
        {
          documentType: 'document',
          activeVersionId: 'abc',
          activeVersionLabel: 'стенд',
        },
      ],
      ready: true,
    });
  });
});

describe('parseStoredSnapshot', () => {
  it('should_return_null_for_empty_or_invalid', () => {
    expect(parseStoredSnapshot(null)).toBeNull();
    expect(parseStoredSnapshot('{')).toBeNull();
    expect(parseStoredSnapshot('[]')).toBeNull();
  });

  it('should_read_stored_items', () => {
    expect(
      parseStoredSnapshot(
        JSON.stringify({
          contour: 'test-stand',
          items: [
            {
              documentType: 'document',
              title: 'document',
              versionId: 'aaa',
              caption: 'aaa',
            },
          ],
        }),
      ),
    ).toEqual([
      {
        documentType: 'document',
        title: 'document',
        versionId: 'aaa',
        caption: 'aaa',
      },
    ]);
  });
});

describe('diffActiveVersions', () => {
  it('should_skip_first_visit', () => {
    expect(diffActiveVersions(null, [item('document', 'aaa')])).toEqual([]);
  });

  it('should_skip_same_ids', () => {
    expect(
      diffActiveVersions(
        [item('document', 'aaa', { caption: 'aaa — старый' })],
        [item('document', 'aaa', { caption: 'aaa — новый' })],
      ),
    ).toEqual([]);
  });

  it('should_list_id_change', () => {
    expect(
      diffActiveVersions(
        [
          item('document', 'aaa', {
            title: 'document',
            caption: 'aaa — стенд',
          }),
        ],
        [
          item('document', 'bbb', {
            title: 'document',
            caption: 'bbb — новая',
          }),
        ],
      ),
    ).toEqual([
      {
        documentType: 'document',
        title: 'document',
        was: 'aaa — стенд',
        became: 'bbb — новая',
      },
    ]);
  });

  it('should_treat_new_active_type_as_none_to_current', () => {
    expect(
      diffActiveVersions(
        [],
        [
          item('related', 'ccc', {
            title: 'related',
            caption: 'ccc',
          }),
        ],
      ),
    ).toEqual([
      {
        documentType: 'related',
        title: 'related',
        was: ACTIVE_VERSION_NONE,
        became: 'ccc',
      },
    ]);
  });

  it('should_omit_new_type_without_active_version', () => {
    expect(diffActiveVersions([], [item('document', null)])).toEqual([]);
  });

  it('should_list_removed_type_that_had_active_version', () => {
    expect(
      diffActiveVersions(
        [
          item('document', 'aaa', {
            title: 'document',
            caption: 'aaa',
          }),
        ],
        [],
      ),
    ).toEqual([
      {
        documentType: 'document',
        title: 'document',
        was: 'aaa',
        became: ACTIVE_VERSION_NONE,
      },
    ]);
  });
});

describe('decideActiveVersionWatch', () => {
  it('should_keep_modal_closed_without_ready_catalog', () => {
    expect(
      decideActiveVersionWatch(
        [item('document', 'aaa')],
        [item('document', 'bbb')],
        false,
      ),
    ).toEqual({ open: false, persist: false, changes: [] });
  });

  it('should_ignore_empty_current_catalog', () => {
    expect(
      decideActiveVersionWatch([item('document', 'aaa')], [], true),
    ).toEqual({ open: false, persist: false, changes: [] });
  });

  it('should_persist_first_visit_without_modal', () => {
    expect(
      decideActiveVersionWatch(null, [item('document', 'aaa')], true),
    ).toEqual({ open: false, persist: true, changes: [] });
    expect(
      decideActiveVersionWatch([], [item('document', 'aaa')], true),
    ).toEqual({ open: false, persist: true, changes: [] });
  });

  it('should_open_only_when_version_id_changed', () => {
    const previous = [
      item('document', 'aaa', {
        title: 'document',
        caption: 'aaa',
      }),
    ];
    const current = [
      item('document', 'bbb', {
        title: 'document',
        caption: 'bbb',
      }),
    ];
    expect(decideActiveVersionWatch(previous, current, true)).toEqual({
      open: true,
      persist: true,
      changes: [
        {
          documentType: 'document',
          title: 'document',
          was: 'aaa',
          became: 'bbb',
        },
      ],
    });
    expect(decideActiveVersionWatch(previous, previous, true)).toEqual({
      open: false,
      persist: true,
      changes: [],
    });
  });
});

describe('toSafeJson', () => {
  it('should_escape_script_breakers', () => {
    expect(toSafeJson({ caption: '</script>' })).toContain(
      '\\u003c/script\\u003e',
    );
  });
});
