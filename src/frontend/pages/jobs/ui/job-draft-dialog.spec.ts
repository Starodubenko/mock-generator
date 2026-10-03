import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JobDraftDialog } from './job-draft-dialog';

const documents = [
  {
    id: 'job-aaaa-00000001',
    status: 'NEW',
    messageType: 'type-a',
    creationDateTime: '2026-09-24T21:00:00+03:00',
    bodyJson:
      '{"id":"job-aaaa-00000001","status":"NEW","nested":{"deep":true}}',
  },
];

describe('JobDraftDialog html', () => {
  it('should_show_collapsible_json_without_table', () => {
    const html = renderToStaticMarkup(
      createElement(JobDraftDialog, {
        jobId: 'job-gen-2',
        contour: 'test-stand',
        open: true,
        canPublish: true,
        canSaveResource: true,
        documents,
      }),
    );
    expect(html).toContain('width:100%');
    expect(html).toContain('height:100%');
    expect(html).toContain('data-draft-panel="json"');
    expect(html).toContain('data-json-tree');
    expect(html).toContain('<details');
    expect(html).toContain('nested');
    expect(html).toContain('job-aaaa-00000001');
    expect(html).toContain('Развернуть все');
    expect(html).toContain('Свернуть все');
    expect(html).toContain('/jobs/job-gen-2/confirm/publish');
    expect(html).toContain('Сохранить в моки');
    expect(html).toContain('/mocks?contour=test-stand&amp;jobId=job-gen-2');
    expect(html).not.toContain('data-draft-panel="table"');
    expect(html).not.toContain('Таблица');
    expect(html).not.toContain('Bearer');
  });

  it('should_hide_when_closed', () => {
    const html = renderToStaticMarkup(
      createElement(JobDraftDialog, {
        jobId: 'job-gen-2',
        contour: 'test-stand',
        open: false,
        canPublish: false,
        documents,
      }),
    );
    expect(html).toBe('');
  });
});
