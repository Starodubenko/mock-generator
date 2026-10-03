import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnumDomainDialog } from './enum-domain-dialog';

describe('EnumDomainDialog html', () => {
  it('should_list_values_and_add_form', () => {
    const html = renderToStaticMarkup(
      createElement(EnumDomainDialog, {
        open: true,
        path: 'messageType',
        values: ['type-a', 'type-b'],
        action: '/profiles/document/versions/v1/enums',
        cancelHref: '/profiles/document/versions/v1?contour=test-stand',
        contour: 'test-stand',
      }),
    );
    expect(html).toContain('Значения messageType');
    expect(html).toContain('type-a');
    expect(html).toContain('type-b');
    expect(html).toContain('method="post"');
    expect(html).toContain('/profiles/document/versions/v1/enums');
    expect(html).toContain('name="value"');
    expect(html).toContain('data-field-hint');
    expect(html).toContain('Новое допустимое значение enum');
    expect(html).toContain('name="path"');
    expect(html).toContain('Добавить');
    expect(html).not.toContain('Bearer');
  });

  it('should_render_nothing_when_closed', () => {
    const html = renderToStaticMarkup(
      createElement(EnumDomainDialog, {
        open: false,
        path: 'status',
        values: ['NEW'],
        action: '/x',
        cancelHref: '/y',
        contour: 'test-stand',
      }),
    );
    expect(html).toBe('');
  });
});
