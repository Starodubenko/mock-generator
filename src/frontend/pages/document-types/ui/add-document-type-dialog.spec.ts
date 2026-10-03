import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AddDocumentTypeDialog } from './add-document-type-dialog';

describe('AddDocumentTypeDialog html', () => {
  it('should_post_slug_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(AddDocumentTypeDialog, {
        open: true,
        contour: 'test-stand',
        cancelHref: '/document-types?contour=test-stand',
        reason: null,
      }),
    );
    expect(html).toContain('Новый тип');
    expect(html).toContain('name="documentType"');
    expect(html).toContain('name="contour"');
    expect(html).toContain('action="/document-types"');
    expect(html).toContain('Назад');
    expect(html).toContain('data-field-hint');
    expect(html).not.toContain('Bearer');
  });

  it('should_render_nothing_when_closed', () => {
    const html = renderToStaticMarkup(
      createElement(AddDocumentTypeDialog, {
        open: false,
        contour: 'test-stand',
        cancelHref: '/document-types?contour=test-stand',
        reason: 'validation_error',
      }),
    );
    expect(html).toBe('');
  });
});
