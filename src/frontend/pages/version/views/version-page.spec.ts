import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VersionPage } from './version-page';

const base = {
  documentType: 'document',
  contour: 'test-stand',
  timeZone: 'Europe/Moscow',
  versionId: 'ver-1',
  createdAt: '2026-09-24T18:00:00.000Z',
  reason: null,
  activeVersionId: 'ver-0',
  rejectedPathCount: 0,
  paths: [
    { path: 'status', pathClass: 'category', categoryValues: ['NEW'] },
    { path: 'nested', pathClass: 'nested' },
    { path: 'nested.flag', pathClass: 'boolean' },
    {
      path: 'tags',
      pathClass: 'array',
      itemPathClass: 'category',
      itemCategoryValues: ['a'],
    },
  ],
  diff: {
    added: [],
    removed: [],
    typeChanged: [],
    rejected: [],
    keptByHysteresis: [],
  },
};

describe('VersionPage html', () => {
  it('should_link_activate_and_rollback_to_confirm', () => {
    const html = renderToStaticMarkup(createElement(VersionPage, base));
    expect(html).toContain(
      '/profiles/document/versions/ver-1/confirm/activate?contour=test-stand',
    );
    expect(html).toContain(
      '/profiles/document/versions/ver-1/confirm/rollback?contour=test-stand',
    );
    expect(html).toContain('/profiles/document/versions/ver-1/schema');
    expect(html).toContain('Редактировать');
    expect(html).toContain('Добавить поле');
    expect(html).toContain('pathName:status');
    expect(html).toContain('Сохранить');
    expect(html).toContain('Отменить');
    expect(html).toContain('Сделать активной новую версию');
    expect(html).toContain('pathClass:status');
    expect(html).toContain('data-schema-edit');
    expect(html).toContain('24.09.2026, 21:00');
    expect(html).toContain('Схема документа');
    expect(html).toContain('data-version-chip="rejected"');
    expect(html).toContain('Отклонённых путей');
    expect(html).toContain('data-version-chip="active"');
    expect(html).toContain('Активная версия');
    expect(html).toContain('data-version-chip="added"');
    expect(html).toContain('Удержано гистерезисом');
    expect(html).toContain('между соседними обучениями');
    expect(html).toContain('два порога');
    expect(html).toContain('data-hover-tip');
    expect(html).toContain('нет');
    expect(html).toContain('data-schema-expand');
    expect(html).toContain('data-schema-expand-split=""');
    expect(html).toContain('data-schema-expand-aside=""');
    expect(html).toContain('data-version-panel="schema"');
    expect(html).toContain('data-version-panel="links"');
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toContain('aria-label="Развернуть"');
    expect(html).toContain('data-version-scroll');
    expect(html).toContain('data-schema-tree');
    expect(html).toContain('overflow-x:auto');
    expect(html).toContain('nested');
    expect(html).toContain('flag');
    expect(html).toContain('boolean');
    expect(html).toContain('array');
    expect(html).toContain('[a]');
    expect(html).toContain('array:category');
    expect(html).toContain('object');
    expect(html).toContain('data-schema-enum-edit');
    expect(html).toContain('data-schema-changed');
    expect(html).toContain('aria-label="Изменено"');
    expect(html).not.toContain('data-schema-enum-view');
    expect(html).not.toContain('editEnum=status');
    expect(html).toContain('Настройки связей');
    expect(html).toContain('data-version-links');
    expect(html).toContain('Связей нет');
    expect(html).toContain('Добавить связь');
    expect(html).toContain('data-field-hint');
  });

  it('should_attach_kind_hints_to_link_rows', () => {
    const html = renderToStaticMarkup(
      createElement(VersionPage, {
        ...base,
        parentChildInvariants: [
          {
            parentPath: 'id',
            childPath: 'entityId',
            arrayPath: 'children',
          },
        ],
      }),
    );
    expect(html).toContain('data-link-kind-hint="parent-child"');
    expect(html).toContain('элемента массива');
    expect(html).toContain('data-version-panel="schema"');
    expect(html).toContain('data-version-panel="links"');
  });

  it('should_summarize_added_paths_in_a_dialog', () => {
    const html = renderToStaticMarkup(
      createElement(VersionPage, {
        ...base,
        diff: {
          ...base.diff,
          added: ['childItems', 'status'],
        },
      }),
    );
    expect(html).toContain('data-version-chip="added"');
    expect(html).toContain('data-diff-open="added"');
    expect(html).toContain('Добавленные поля');
    expect(html).toContain('data-diff-list="added"');
    expect(html).toContain('childItems');
    expect(html).not.toContain('childItems, status');
    expect(html).not.toContain('Bearer');
  });

  it('should_open_enum_modal_with_add', () => {
    const html = renderToStaticMarkup(
      createElement(VersionPage, { ...base, editEnumPath: 'status' }),
    );
    expect(html).toContain('Значения status');
    expect(html).toContain('NEW');
    expect(html).toContain('/profiles/document/versions/ver-1/enums');
    expect(html).toContain('name="value"');
    expect(html).toContain('Добавить');
    expect(html).not.toContain('Bearer');
  });

  it('should_ask_before_activate', () => {
    const html = renderToStaticMarkup(
      createElement(VersionPage, { ...base, confirm: 'activate' }),
    );
    expect(html).toContain('Сделать версию рабочей?');
    expect(html).toContain('/profiles/document/versions/ver-1/activate');
    expect(html).toContain('method="post"');
    expect(html).toContain('name="contour"');
  });
});
