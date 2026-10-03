import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VersionsPage } from './versions-page';

describe('VersionsPage html', () => {
  it('should_list_version_with_alias_activate_and_delete_confirm', () => {
    const html = renderToStaticMarkup(
      createElement(VersionsPage, {
        documentType: 'document',
        contour: 'test-stand',
        reason: null,
        timeZone: 'Europe/Moscow',
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
        confirmDelete: 'bbbb2222',
        confirmActivate: null,
        nameVersion: null,
        pendingHref: null,
      }),
    );
    expect(html).toContain('aaaa1111 — стенд');
    expect(html).toContain('27.09.2026, 13:00');
    expect(html.indexOf('bbbb2222')).toBeLessThan(
      html.indexOf('aaaa1111 — стенд'),
    );
    expect(html).toContain('текущий');
    expect(html).toContain('document');
    expect(html).toContain('bbbb2222');
    expect(html).toContain('Активировать');
    expect(html).toContain('confirmActivate=bbbb2222');
    expect(html).toContain('/profiles/document/versions/bbbb2222/delete');
    expect(html).toContain('Удалить версию?');
    expect(html).not.toContain('confirmDelete=aaaa1111');
    expect(html).not.toContain('Bearer');
  });

  it('should_confirm_activate_from_list', () => {
    const html = renderToStaticMarkup(
      createElement(VersionsPage, {
        documentType: 'document',
        contour: 'test-stand',
        reason: null,
        timeZone: 'Europe/Moscow',
        versions: [
          {
            versionId: 'bbbb2222',
            label: null,
            createdAt: '2026-09-27T10:00:00Z',
            active: false,
            activatable: true,
          },
        ],
        confirmDelete: null,
        confirmActivate: 'bbbb2222',
        nameVersion: null,
        pendingHref: null,
      }),
    );
    expect(html).toContain('Сделать версию текущей?');
    expect(html).toContain('/profiles/document/versions/bbbb2222/activate');
    expect(html).toContain('name="returnTo"');
    expect(html).toContain('value="list"');
  });

  it('should_show_train_notice_when_there_are_no_versions', () => {
    const html = renderToStaticMarkup(
      createElement(VersionsPage, {
        documentType: 'document',
        contour: 'test-stand',
        reason: null,
        timeZone: 'Europe/Moscow',
        versions: [],
        confirmDelete: null,
        confirmActivate: null,
        nameVersion: null,
        pendingHref: null,
      }),
    );
    expect(html).toContain('Нет версий профиля');
    expect(html).toContain('Обучить');
    expect(html).toContain('href="/profiles/document?contour=test-stand"');
    expect(html).not.toContain('Пока нет сохранённых версий');
    expect(html).not.toContain('confirmActivate=');
    expect(html).not.toContain('Bearer');
  });
});
