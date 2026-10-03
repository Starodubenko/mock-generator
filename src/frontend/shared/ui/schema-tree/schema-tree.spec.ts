import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchemaTree } from './schema-tree';

describe('SchemaTree html', () => {
  it('should_render_nested_document_shape_with_colored_types', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          { path: 'id', pathClass: 'identifier' },
          { path: 'nested', pathClass: 'nested' },
          { path: 'nested.flag', pathClass: 'boolean' },
          { path: 'status', pathClass: 'category', categoryValues: ['NEW'] },
        ],
      }),
    );
    expect(html).toContain('nested');
    expect(html).toContain('flag');
    expect(html).toContain('boolean');
    expect(html).toContain('object');
    expect(html).toContain('string');
    expect(html).toContain('enum');
    expect(html).toContain('[NEW]');
    expect(html).toContain('#9b59b6');
    expect(html).toContain('#55a538');
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toContain('overflow-x:auto');
    expect(html).toContain('max-content');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('Изменить');
  });

  it('should_hide_enum_edit_outside_type_edit', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          {
            path: 'messageType',
            pathClass: 'category',
            categoryValues: ['type-a'],
          },
        ],
      }),
    );
    expect(html).toContain('[type-a]');
    expect(html).not.toContain('Изменить');
  });

  it('should_render_type_dropdowns_when_editable', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        typeEdit: true,
        paths: [
          { path: 'status', pathClass: 'category', categoryValues: ['NEW'] },
          { path: 'amount', pathClass: 'number-string' },
          { path: 'tags', pathClass: 'array', itemPathClass: 'free-text' },
        ],
      }),
    );
    expect(html).toContain('pathClass:status');
    expect(html).toContain('pathClass:amount');
    expect(html).toContain('array:free-text');
    expect(html).toContain('pathName:status');
    expect(html).toContain('pathName:amount');
    expect(html).toContain('data-schema-name-edit');
    expect(html).toContain('data-schema-added-host');
    expect(html).toContain('data-schema-type-edit');
    expect(html).toContain('data-schema-enum-edit');
    expect(html).toContain('data-schema-changed');
    expect(html).toContain('aria-label="Изменено"');
    expect(html).toContain('data-schema-enum-caption');
    expect(html).toContain('enumAdded:status');
  });

  it('should_mark_array_with_item_type', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          {
            path: 'tags',
            pathClass: 'array',
            itemPathClass: 'category',
            itemCategoryValues: ['a'],
          },
        ],
      }),
    );
    expect(html).toContain('array');
    expect(html).toContain('string');
    expect(html).toContain('enum');
    expect(html).toContain('[a]');
    expect(html).toContain('#e67e22');
    expect(html).toContain('width:auto');
    expect(html.indexOf('data-schema-type-mark')).toBeLessThan(
      html.indexOf('[a]'),
    );
    expect(html).not.toContain('<details');
  });

  it('should_render_type_union_after_colon', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          {
            path: 'status',
            pathClass: 'category',
            categoryValues: ['NEW'],
            typeVariants: ['string', 'null'],
          },
        ],
      }),
    );
    expect(html).toContain('status');
    expect(html).toContain('string');
    expect(html).toContain('|');
    expect(html).toContain('null');
    expect(html).not.toContain('Bearer');
  });

  it('should_wrap_object_arrays_when_children_exist', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          { path: 'items', pathClass: 'array', itemPathClass: 'nested' },
          {
            path: 'items.code',
            pathClass: 'category',
            categoryValues: ['type-a'],
          },
        ],
      }),
    );
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toContain('array');
    expect(html).toContain('object');
    expect(html).toContain('code');
    expect(html).toContain('enum');
    expect(html).toContain('[type-a]');
  });

  it('should_collapse_empty_object_array_like_a_plain_object', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          { path: 'markers', pathClass: 'array', itemPathClass: 'nested' },
        ],
      }),
    );
    expect(html).toContain('<details');
    expect(html).toContain('array');
    expect(html).toContain('object');
  });

  it('should_render_type_union_after_colon', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaTree, {
        paths: [
          {
            path: 'status',
            pathClass: 'category',
            categoryValues: ['NEW'],
            typeVariants: ['string', 'null'],
          },
        ],
      }),
    );
    expect(html).toContain('status');
    expect(html).toContain('string');
    expect(html).toContain('|');
    expect(html).toContain('null');
    expect(html).not.toContain('Bearer');
  });
});
