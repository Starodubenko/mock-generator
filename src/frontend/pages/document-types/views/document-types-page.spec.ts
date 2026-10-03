import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentTypesPage } from './document-types-page';

describe('DocumentTypesPage html', () => {
  it('should_render_collapsible_type_with_profiles_and_delete_warning', () => {
    const html = renderToStaticMarkup(
      createElement(DocumentTypesPage, {
        contour: 'test-stand',
        timeZone: 'Europe/Moscow',
        reason: null,
        types: [
          {
            documentType: 'document',
            activeVersionId: 'aaaa1111',
            activeVersionLabel: 'стенд',
            versions: [
              {
                versionId: 'aaaa1111',
                label: 'стенд',
                createdAt: '2026-01-01T00:00:00Z',
                active: true,
                activatable: true,
              },
              {
                versionId: 'bbbb2222',
                label: null,
                createdAt: '2026-09-27T10:00:00Z',
                active: false,
                activatable: true,
              },
            ],
          },
        ],
        openType: 'document',
        confirmDeleteType: 'document',
        confirmDeleteVersion: null,
        confirmActivate: null,
        nameVersion: null,
        pendingHref: null,
        addType: false,
      }),
    );
    expect(html).toContain('Типы документов');
    expect(html).toContain('<details');
    expect(html).toContain('document');
    expect(html).toContain('aaaa1111 — стенд');
    expect(html).toContain('27.09.2026, 13:00');
    expect(html).toContain('01.01.2026, 03:00');
    expect(html.indexOf('27.09.2026, 13:00')).toBeLessThan(
      html.indexOf('01.01.2026, 03:00'),
    );
    expect(html).toContain('текущий');
    expect(html).toContain('flex-direction:row');
    expect(html).toContain('bbbb2222');
    expect(html).toContain('Удалить тип');
    expect(html).toContain('все его профили');
    expect(html).toContain('/document-types/document/delete');
    expect(html).toContain('confirmActivate=bbbb2222');
    expect(html).toContain('confirmDeleteVersion=bbbb2222');
    expect(html).toContain('/profiles/document/versions/bbbb2222');
    expect(html).not.toContain('Bearer');
  });

  it('should_show_empty_profiles_notice_inside_type', () => {
    const html = renderToStaticMarkup(
      createElement(DocumentTypesPage, {
        contour: 'test-stand',
        timeZone: 'Europe/Moscow',
        reason: null,
        types: [
          {
            documentType: 'document',
            activeVersionId: null,
            activeVersionLabel: null,
            versions: [],
          },
        ],
        openType: 'document',
        confirmDeleteType: null,
        confirmDeleteVersion: null,
        confirmActivate: null,
        nameVersion: null,
        pendingHref: null,
        addType: false,
      }),
    );
    expect(html).toContain('нет профиля');
    expect(html).toContain('Обучить');
    expect(html).toContain('href="/profiles/document?contour=test-stand"');
    expect(html).toContain('addType=1');
    expect(html).not.toContain('name="documentType"');
    expect(html).not.toContain('Версии:');
  });

  it('should_open_alias_dialog_when_name_version_is_set', () => {
    const html = renderToStaticMarkup(
      createElement(DocumentTypesPage, {
        contour: 'test-stand',
        timeZone: 'Europe/Moscow',
        reason: null,
        types: [
          {
            documentType: 'document',
            activeVersionId: null,
            activeVersionLabel: null,
            versions: [],
          },
        ],
        openType: 'document',
        confirmDeleteType: null,
        confirmDeleteVersion: null,
        confirmActivate: null,
        nameVersion: 'ver-new',
        pendingHref: null,
        addType: false,
      }),
    );
    expect(html).toContain('Имя версии ver-new');
    expect(html).toContain(
      'action="/profiles/document/versions/ver-new/alias"',
    );
    expect(html).toContain('name="label"');
  });

  it('should_open_add_type_in_modal', () => {
    const html = renderToStaticMarkup(
      createElement(DocumentTypesPage, {
        contour: 'test-stand',
        timeZone: 'Europe/Moscow',
        reason: null,
        types: [],
        openType: null,
        confirmDeleteType: null,
        confirmDeleteVersion: null,
        confirmActivate: null,
        nameVersion: null,
        pendingHref: null,
        addType: true,
      }),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Новый тип');
    expect(html).toContain('name="documentType"');
    expect(html).toContain('action="/document-types"');
  });
});
