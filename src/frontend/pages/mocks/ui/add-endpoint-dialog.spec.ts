import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AddEndpointDialog } from './add-endpoint-dialog';

describe('AddEndpointDialog html', () => {
  it('should_render_modal_with_group_select', () => {
    const html = renderToStaticMarkup(
      createElement(AddEndpointDialog, {
        open: true,
        groups: ['Tasks', 'Orders'],
        group: 'Orders',
        path: '/api/orders',
        httpMethod: 'POST',
        summary: 'Создать',
        contour: 'test-stand',
        cancelHref: '/mocks?contour=test-stand',
        reason: 'mock_endpoint_exists',
      }),
    );
    expect(html).toContain('data-add-endpoint');
    expect(html).toContain('aria-modal');
    expect(html).toContain('position:fixed');
    expect(html).toContain('method="post"');
    expect(html).toContain('/mocks/endpoints');
    expect(html).toContain('name="group"');
    expect(html).toContain('name="httpMethod"');
    expect(html).toContain('name="path"');
    expect(html).toContain('/api/orders');
    expect(html).toContain('Эндпоинт с таким методом и путём уже есть');
    expect(html).toContain('Orders');
    expect(html).toContain('Tasks');
    expect(html).toContain('/mocks?contour=test-stand');
    expect(html).toContain('data-kit-select');
    expect(html).not.toContain('name="method"');
    expect(html).not.toMatch(/name="group"[^>]*type="text"/);
  });

  it('should_hide_when_closed', () => {
    const html = renderToStaticMarkup(
      createElement(AddEndpointDialog, {
        open: false,
        groups: ['Tasks'],
        group: 'Tasks',
        path: '',
        httpMethod: '',
        summary: '',
        contour: 'test-stand',
        cancelHref: '/mocks?contour=test-stand',
        reason: null,
      }),
    );
    expect(html).toBe('');
  });
});
