import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MocksPage } from './mocks-page';

const catalogProps = {
  contour: 'test-stand',
  reason: null,
  groups: ['Tasks'],
  endpoints: [
    {
      method: 'GET',
      path: '/api/tasks',
      group: 'Tasks',
      summary: 'Список задач',
      jobId: '',
      updatedAt: '2026-01-01',
      hasBody: false,
    },
  ],
  shareOrigin: 'http://127.0.0.1:3100',
  publicOrigin: 'http://127.0.0.1:3000',
  addGroup: '',
  addPath: '',
  addHttpMethod: '',
  addSummary: '',
  addEndpoint: false,
  jobId: 'job-gen-2' as string | null,
  draftCount: 1,
  confirmDeleteGroup: null as string | null,
  confirmDeleteMethod: null as string | null,
  confirmDeletePath: null as string | null,
  confirmBind: false,
  bindGroup: 'Tasks',
  bindTargets: [] as string[],
};

describe('MocksPage html', () => {
  it('should_look_like_swagger_catalog_and_bind_after_generate', () => {
    const html = renderToStaticMarkup(createElement(MocksPage, catalogProps));
    expect(html).toContain('data-swagger-shell');
    expect(html).toContain('data-swagger-tag="Tasks"');
    expect(html).toContain('data-swagger-op');
    expect(html).toContain('GET');
    expect(html).toContain('/api/tasks');
    expect(html).toContain('/mocks/new');
    expect(html).toContain('confirmBind');
    expect(html).toContain('data-bind-job');
    expect(html).toContain('name="bindGroup"');
    expect(html).toContain('name="endpoint"');
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('confirmDeleteGroup=Tasks');
    expect(html).toContain('confirmDeleteMethod=GET');
    expect(html).toContain('confirmDeletePath=%2Fapi%2Ftasks');
    expect(html).toContain('http://127.0.0.1:3000/api/tasks');
    expect(html).toContain('http://127.0.0.1:3100/api/tasks');
    expect(html).toContain('href="http://127.0.0.1:3000/api/tasks"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('data-add-endpoint');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });

  it('should_open_add_endpoint_modal_and_bind_confirm', () => {
    const html = renderToStaticMarkup(
      createElement(MocksPage, {
        ...catalogProps,
        addEndpoint: true,
        confirmBind: true,
        bindTargets: ['GET /api/tasks'],
      }),
    );
    expect(html).toContain('data-add-endpoint');
    expect(html).toContain('name="group"');
    expect(html).toContain('name="httpMethod"');
    expect(html).toContain('/mocks/bind');
    expect(html).toContain('Сохранить черновик в ответ?');
    expect(html).toContain('GET /api/tasks');
    expect(html).not.toContain('data-bind-job');
  });

  it('should_show_duplicate_errors_for_group_and_endpoint', () => {
    const groupHtml = renderToStaticMarkup(
      createElement(MocksPage, {
        ...catalogProps,
        reason: 'mock_group_exists',
        addGroup: 'Tasks',
      }),
    );
    expect(groupHtml).toContain('Группа с таким именем уже есть');
    expect(groupHtml).toContain('value="Tasks"');
    expect(groupHtml).toContain('role="alert"');
    const emptyHtml = renderToStaticMarkup(
      createElement(MocksPage, {
        ...catalogProps,
        reason: 'validation_error',
      }),
    );
    expect(emptyHtml).toContain('Mui-error');
    expect(emptyHtml).not.toContain('Ошибка проверки полей');
    expect(emptyHtml).not.toContain('data-console-toast-seed');
    const endpointHtml = renderToStaticMarkup(
      createElement(MocksPage, {
        ...catalogProps,
        addEndpoint: true,
        reason: 'mock_endpoint_exists',
      }),
    );
    expect(endpointHtml).toContain('Эндпоинт с таким методом и путём уже есть');
    expect(endpointHtml).not.toContain('data-console-toast-seed');
  });
});
