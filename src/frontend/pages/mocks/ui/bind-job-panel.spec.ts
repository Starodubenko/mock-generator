import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BindJobPanel } from './bind-job-panel';

const endpoints = [
  {
    method: 'GET',
    path: '/api/orders',
    group: 'Orders',
    summary: 'Список',
    hasBody: false,
  },
  {
    method: 'GET',
    path: '/api/tasks',
    group: 'Tasks',
    summary: 'Список',
    hasBody: true,
  },
];

describe('BindJobPanel html', () => {
  it('should_offer_group_and_endpoint_selects', () => {
    const html = renderToStaticMarkup(
      createElement(BindJobPanel, {
        open: true,
        jobId: 'job-gen-2',
        draftCount: 2,
        contour: 'test-stand',
        groups: ['Orders', 'Tasks'],
        bindGroup: 'Orders',
        endpoints,
      }),
    );
    expect(html).toContain('data-bind-job');
    expect(html).toContain('aria-modal');
    expect(html).toContain('name="bindGroup"');
    expect(html).toContain('name="endpoint"');
    expect(html).toContain('GET /api/orders');
    expect(html).not.toContain('GET /api/tasks');
    expect(html).toContain('confirmBind');
    expect(html).not.toContain('type="checkbox"');
  });

  it('should_hide_when_closed', () => {
    const html = renderToStaticMarkup(
      createElement(BindJobPanel, {
        open: false,
        jobId: 'job-gen-2',
        draftCount: 1,
        contour: 'test-stand',
        groups: ['Tasks'],
        bindGroup: 'Tasks',
        endpoints,
      }),
    );
    expect(html).toBe('');
  });
});
