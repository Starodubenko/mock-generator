import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  FIELD_HINTS,
  SEED_FIELD_LABEL,
} from '@frontend/shared/i18n/field-hints';
import { GeneratePage } from './generate-page';

describe('GeneratePage html', () => {
  it('should_render_constraint_controls_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(GeneratePage, {
        contour: 'test-stand',
        reason: null,
        seed: 'stand-24',
        count: '10',
        targetIndex: 'documents-synthetic',
        profileVersionId: 'abcd1234',
        timeZone: 'Europe/Moscow',
        profileVersions: [
          {
            versionId: 'abcd1234',
            label: 'стенд',
            createdAt: '2026-09-24T18:00:00.000Z',
            active: true,
          },
          {
            versionId: 'old-ver',
            createdAt: '2026-01-01T00:00:00Z',
            active: false,
          },
        ],
        idempotencyKey: 'key-1',
        schemaPaths: [
          {
            path: 'status',
            pathClass: 'category',
            categoryValues: ['NEW', 'ERROR'],
          },
          { path: 'priority', pathClass: 'boolean' },
          { path: 'docDate', pathClass: 'datetime', datetimeFormat: 'date' },
          { path: 'nested', pathClass: 'nested' },
          { path: 'nested.flag', pathClass: 'boolean' },
          { path: 'hits.hits', pathClass: 'array', itemPathClass: 'nested' },
        ],
      }),
    );
    expect(html).toContain('name="profileVersionId"');
    expect(html).toContain('name="documentType"');
    expect(html).toContain('value="document"');
    expect(html).toContain('id="profile-version-select"');
    expect(html).toContain(SEED_FIELD_LABEL);
    expect(html).toContain('name="seed"');
    expect(html).not.toContain('Seed (зерно)');
    expect(html).toContain(FIELD_HINTS.seed);
    expect(html).toContain(FIELD_HINTS.count);
    expect(html).toContain(FIELD_HINTS.arrayPaths);
    expect(html).toContain(FIELD_HINTS.addArrayPath);
    expect(html).toContain('name="targetIndex"');
    expect(html).toContain('type="hidden"');
    expect(html).not.toContain('id="generate-target-index"');
    expect(html).not.toContain('Целевой индекс');
    expect(html).not.toContain(FIELD_HINTS.targetIndex);
    expect(html).toContain(FIELD_HINTS.profileVersion);
    expect(html).toContain(FIELD_HINTS.documentSchema);
    expect(html).toContain('aria-label="' + FIELD_HINTS.documentSchema + '"');
    expect(html).toContain(FIELD_HINTS.constraintBoolean);
    expect(html).toContain(FIELD_HINTS.constraintCategory);
    expect(html).toContain(FIELD_HINTS.constraintDatetime);
    expect(html).toContain('abcd1234 — стенд (активна) · 24.09.2026, 21:00');
    expect(html).toContain('old-ver · 01.01.2026, 03:00');
    expect(html).toContain('Рабочая версия контура');
    expect(html).not.toContain('Показать поля версии');
    expect(html).not.toMatch(/MuiInputLabel[^>]*>Версия профиля/);
    expect(html).toContain('Схема документа');
    expect(html).toContain('data-schema-expand');
    expect(html).toContain('aria-label="Развернуть"');
    expect(html).toContain('Закрыть');
    expect(html).toContain('data-schema-scroll');
    expect(html).toContain('width:200px');
    expect(html).toContain('data-constraint-control');
    expect(html).toContain('grid-template-columns:200px 22px');
    expect(html).toContain('id="generate-seed"');
    expect(html).toContain('overflow-x:auto');
    expect(html).toContain('grid-template-columns');
    expect(html.indexOf('Схема документа')).toBeLessThan(
      html.indexOf('Запустить задание'),
    );
    expect(html.indexOf('Запустить задание')).toBeLessThan(
      html.indexOf('constraint.status'),
    );
    expect(html).toContain('constraint.status');
    expect(html).toContain('data-kit-select');
    expect(html).toContain('data-submit-on-change="true"');
    expect(html).toContain('MuiMenuItem');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).not.toMatch(/<select[\s>]/);
    expect(html).not.toContain('data-native-dropdown');
    expect(html).toContain('NEW');
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('constraint.priority');
    expect(html).toContain('constraint.docDate');
    expect(html).toContain('id="constraint-priority"');
    expect(html).toContain('aria-label="priority"');
    expect(html).toContain('nested');
    expect(html).toContain('flag');
    expect(html).toContain('object');
    expect(html).toContain('boolean');
    expect(html).toContain('Все из профиля');
    expect(html).toContain('type="date"');
    expect(html).toContain('method="post"');
    expect(html).toContain('data-array-paths');
    expect(html).toContain('name="draftArrayPath"');
    expect(html).toContain('name="confirmAddArrayPath"');
    expect(html).toContain('value="hits.hits"');
    expect(html).toContain('name="confirmStart"');
    expect(html).toContain('id="generate-nav"');
    expect(html).toContain('form="generate-nav"');
    expect(html).toContain(FIELD_HINTS.startGenerate);
    expect(html).not.toContain('name="generatedAt"');
    expect(html).not.toContain('Метка времени');
    expect(html).not.toMatch(/MuiInputLabel[^>]*>priority</);
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });

  it('should_hide_generate_fields_when_there_are_no_versions', () => {
    const html = renderToStaticMarkup(
      createElement(GeneratePage, {
        contour: 'test-stand',
        reason: null,
        seed: 'stand-24',
        count: '10',
        targetIndex: 'documents-synthetic',
        profileVersionId: '',
        profileVersions: [],
        idempotencyKey: 'key-1',
      }),
    );
    expect(html).toContain('Нет версий профиля');
    expect(html).toContain('Обучить');
    expect(html).toContain('href="/profiles/document?contour=test-stand"');
    expect(html).toContain('document');
    expect(html).not.toContain('name="seed"');
    expect(html).not.toContain('name="count"');
    expect(html).not.toContain('name="targetIndex"');
    expect(html).not.toContain('id="profile-version-select"');
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain('data-schema-expand');
    expect(html).not.toContain('Показать поля версии');
    expect(html).not.toContain('Bearer');
  });

  it('should_keep_passed_document_type_and_version', () => {
    const html = renderToStaticMarkup(
      createElement(GeneratePage, {
        contour: 'test-stand',
        documentType: 'related',
        reason: null,
        seed: 'stand-24',
        count: '10',
        targetIndex: 'documents-synthetic',
        profileVersionId: 'f3cb07be',
        timeZone: 'Europe/Moscow',
        profileVersions: [
          {
            versionId: 'f3cb07be',
            label: 'йцуей',
            createdAt: '2026-09-24T18:00:00.000Z',
            active: true,
          },
        ],
        idempotencyKey: 'key-1',
        schemaPaths: [
          { path: 'status', pathClass: 'category', categoryValues: ['NEW'] },
        ],
      }),
    );
    expect(html).toContain('related');
    expect(html).toContain('value="related"');
    expect(html).toContain('f3cb07be — йцуей (активна)');
  });

  it('should_confirm_array_path_and_start', () => {
    const html = renderToStaticMarkup(
      createElement(GeneratePage, {
        contour: 'test-stand',
        reason: null,
        seed: 'stand-24',
        count: '100',
        targetIndex: 'documents-synthetic',
        profileVersionId: 'abcd1234',
        profileVersions: [
          {
            versionId: 'abcd1234',
            createdAt: '2026-09-24T18:00:00.000Z',
            active: true,
          },
        ],
        idempotencyKey: 'key-1',
        arrayPaths: ['hits.hits'],
        confirmAddArrayPath: 'tags',
        confirmStart: true,
        schemaPaths: [
          { path: 'hits.hits', pathClass: 'array', itemPathClass: 'nested' },
          { path: 'tags', pathClass: 'array', itemPathClass: 'category' },
        ],
      }),
    );
    expect(html).toContain('Добавить путь «tags»?');
    expect(html).toContain('Запустить генерацию?');
    expect(html).toContain('hits.hits');
    expect(html).toContain('data-array-path-chip="hits.hits"');
    expect(html).toContain('name="confirmRemoveArrayPath"');
    expect(html).toContain('Этот путь уже в списке');
  });
});
