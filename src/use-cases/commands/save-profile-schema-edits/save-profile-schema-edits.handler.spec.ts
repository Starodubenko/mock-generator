import { SaveProfileSchemaEditsHandler } from './save-profile-schema-edits.handler';
import { ActivateProfileHandler } from '../activate-profile/activate-profile.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import { InMemoryProcessStore } from '@infra/local-data/in-memory-process.store';
import { inMemoryDatabase } from '@infra/local-data/in-memory-database';
import type {
  PathStats,
  ProfileVersion,
} from '@entities/profile/profile.types';

const path = (
  name: string,
  pathClass: PathStats['pathClass'],
  extras: Partial<PathStats> = {},
): PathStats => ({
  path: name,
  pathClass,
  presenceRate: 1,
  nullRate: 0,
  emptyStringRate: 0,
  emptyArrayRate: 0,
  emptyObjectRate: 0,
  cardinality: 1,
  missingKeyRate: 0,
  ...extras,
});

const version: ProfileVersion = {
  versionId: 'v1',
  documentType: 'document',
  contour: 'test-stand',
  snapshotId: 'pit',
  createdAt: '2026-01-01T00:00:00Z',
  mappingIndex: 'documents-synthetic',
  aliases: [],
  corpusValueFingerprints: new Set(),
  sampleDocumentCount: 10,
  activatable: true,
  paths: [
    path('status', 'category', { categoryValues: ['NEW'] }),
    path('amount', 'number-string'),
  ],
};

describe('SaveProfileSchemaEditsHandler', () => {
  const previousContours = process.env.ALLOWED_CONTOURS;
  const store = new InMemoryProcessStore();
  let handler: SaveProfileSchemaEditsHandler;

  beforeEach(async () => {
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow';
    handler = new SaveProfileSchemaEditsHandler(
      store,
      new ActivateProfileHandler(store),
    );
    inMemoryDatabase.profileVersions.clear();
    inMemoryDatabase.enumExtrasByVersion.clear();
    inMemoryDatabase.activeVersionByContour.clear();
    inMemoryDatabase.activationJournal.splice(0);
    await store.saveProfile(version);
    await store.setActiveVersionId('document', 'test-stand', 'v1');
  });

  afterEach(() => {
    process.env.ALLOWED_CONTOURS = previousContours;
  });

  it('should_save_a_new_version_without_activating_it', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      pathClassByPath: {
        status: 'free-text',
        amount: 'number-string',
      },
      activate: false,
      createdAt: '2026-03-01T00:00:00Z',
    });
    expect(result.created).toBe(true);
    expect(result.activated).toBe(false);
    expect(result.versionId).not.toBe('v1');
    expect(
      (await store.getProfile('document', 'test-stand', 'v1'))?.paths.find(
        (item) => item.path === 'status',
      )?.pathClass,
    ).toBe('category');
    expect(
      (
        await store.getProfile('document', 'test-stand', result.versionId)
      )?.paths.find((item) => item.path === 'status')?.pathClass,
    ).toBe('free-text');
    expect(await store.getActiveVersionId('document', 'test-stand')).toBe(
      'v1',
    );
  });

  it('should_activate_the_new_version_when_asked', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      pathClassByPath: {
        status: 'category',
        amount: 'boolean',
      },
      activate: true,
      createdAt: '2026-03-01T00:00:00Z',
    });
    expect(result.created).toBe(true);
    expect(result.activated).toBe(true);
    expect(await store.getActiveVersionId('document', 'test-stand')).toBe(
      result.versionId,
    );
  });

  it('should_keep_previous_active_when_new_version_is_not_activatable', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      pathClassByPath: {
        status: 'rejected',
        amount: 'number-string',
      },
      activate: true,
      createdAt: '2026-03-01T00:00:00Z',
    });
    expect(result.created).toBe(true);
    expect(result.activated).toBe(false);
    expect(result.activateReason).toBe('type_conflict');
    expect(await store.getActiveVersionId('document', 'test-stand')).toBe(
      'v1',
    );
    expect(
      (await store.getProfile('document', 'test-stand', result.versionId))
        ?.activatable,
    ).toBe(false);
  });

  it('should_return_source_when_nothing_changed', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      pathClassByPath: {
        status: 'category',
        amount: 'number-string',
      },
      activate: false,
      createdAt: '2026-03-01T00:00:00Z',
    });
    expect(result).toEqual({
      versionId: 'v1',
      created: false,
      activated: false,
      activateReason: null,
    });
  });

  it('should_rename_and_add_paths', async () => {
    const result = await handler.execute({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      pathClassByPath: {
        status: 'category',
        amount: 'number-string',
        note: 'free-text',
      },
      pathNameByPath: { status: 'state' },
      activate: false,
      createdAt: '2026-03-01T00:00:00Z',
    });
    expect(result.created).toBe(true);
    const stored = await store.getProfile(
      'document',
      'test-stand',
      result.versionId,
    );
    expect(stored?.paths.map((item) => item.path)).toEqual([
      'amount',
      'note',
      'state',
    ]);
    expect(stored?.aliases).toEqual([{ from: 'status', to: 'state' }]);
  });

  it('should_reject_missing_version', async () => {
    await expect(
      handler.execute({
        documentType: 'document',
        contour: 'test-stand',
        versionId: 'missing',
        pathClassByPath: {},
        activate: false,
        createdAt: '2026-03-01T00:00:00Z',
      }),
    ).rejects.toThrow(DomainHttpException);
  });
});
