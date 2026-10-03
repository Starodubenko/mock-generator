import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JobListPage } from './job-list-page';

const jobs = [
  {
    jobId: 'old-job',
    kind: 'train',
    state: 'succeeded',
    createdAt: '2026-01-01T00:00:00Z',
    documentType: 'document',
    requestedCount: null,
  },
  {
    jobId: 'new-job',
    kind: 'generate',
    state: 'preview',
    createdAt: '2026-09-27T18:00:00.000Z',
    documentType: 'document',
    requestedCount: 100,
  },
];

describe('JobListPage html', () => {
  it('should_render_ranked_table_with_pagination', () => {
    const html = renderToStaticMarkup(
      createElement(JobListPage, {
        contour: 'test-stand',
        timeZone: 'Europe/Moscow',
        jobs,
      }),
    );
    expect(html).toContain('Задание');
    expect(html).toContain('Вид и состояние');
    expect(html).toContain('На странице');
    expect(html.indexOf('new-job')).toBeLessThan(html.indexOf('old-job'));
    expect(html).toContain('27.09.2026');
    expect(html).toContain('генерация');
    expect(html).toContain('черновик');
    expect(html).toContain('100');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });
});
