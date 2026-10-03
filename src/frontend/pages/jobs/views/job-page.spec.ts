import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JobPage } from './job-page';

describe('JobPage html', () => {
  it('should_explain_that_train_job_does_not_publish', () => {
    const html = renderToStaticMarkup(
      createElement(JobPage, {
        job: {
          jobId: 'job-train-1',
          kind: 'train',
          state: 'succeeded',
          reason: null,
          documentType: 'document',
          contour: 'test-stand',
          profileVersionId: 'c6500866',
          publishedCount: 0,
          quarantineCount: 0,
          requestedCount: 1000,
        },
      }),
    );
    expect(html).toContain('обучение');
    expect(html).toContain('не публикуются');
    expect(html).toContain(
      '/profiles/document/versions/c6500866?contour=test-stand',
    );
    expect(html).toContain('Версия:');
    expect(html).toContain('>c6500866<');
    expect(html).not.toContain('Открыть');
    expect(html).toContain('data-job-version');
    expect(html).toContain('data-job-actions');
    expect(html).toContain('justify-content:flex-end');
    expect(html).not.toContain('Bearer');
  });

  it('should_show_publish_counters_for_generate_job', () => {
    const html = renderToStaticMarkup(
      createElement(JobPage, {
        job: {
          jobId: 'job-gen-1',
          kind: 'generate',
          state: 'succeeded',
          reason: null,
          documentType: 'document',
          contour: 'test-stand',
          profileVersionId: 'c6500866',
          publishedCount: 1000,
          quarantineCount: 0,
          requestedCount: 1000,
        },
      }),
    );
    expect(html).toContain('генерация');
    expect(html).toContain('Опубликовано: 1000');
    expect(html).toContain('Запрошено: 1000');
  });

  it('should_show_field_constraints_for_generate_job', () => {
    const html = renderToStaticMarkup(
      createElement(JobPage, {
        job: {
          jobId: 'job-gen-4',
          kind: 'generate',
          state: 'preview',
          reason: null,
          documentType: 'document',
          contour: 'test-stand',
          profileVersionId: 'c6500866',
          publishedCount: 0,
          quarantineCount: 0,
          requestedCount: 3,
          fieldConstraints: [
            { path: 'status', kind: 'category', values: ['NEW'] },
          ],
        },
        draftCount: 3,
      }),
    );
    expect(html).toContain('Ограничения пачки');
    expect(html).toContain('status=NEW');
  });

  it('should_open_draft_modal_with_publish_for_preview_job', () => {
    const html = renderToStaticMarkup(
      createElement(JobPage, {
        job: {
          jobId: 'job-gen-2',
          kind: 'generate',
          state: 'preview',
          reason: null,
          documentType: 'document',
          contour: 'test-stand',
          profileVersionId: 'c6500866',
          publishedCount: 0,
          quarantineCount: 0,
          requestedCount: 2,
        },
        viewData: true,
        draftCount: 1,
        documents: [
          {
            id: 'job-aaaa-00000001',
            status: 'NEW',
            messageType: 'type-a',
            creationDateTime: '2026-09-24T21:00:00+03:00',
            bodyJson: '{"id":"job-aaaa-00000001","status":"NEW"}',
          },
        ],
      }),
    );
    expect(html).toContain('Посмотреть данные');
    expect(html).toContain('data-job-actions');
    expect(html).toContain('justify-content:flex-end');
    expect(html).toContain('Версия:');
    expect(html).not.toContain('Открыть c6500866');
    expect(html).toContain('/jobs/job-gen-2/data');
    expect(html).toContain('Сгенерированная пачка');
    expect(html).toContain('Опубликовать');
    expect(html).toContain('Сохранить в моки');
    expect(html).toContain('/mocks?contour=test-stand&amp;jobId=job-gen-2');
    expect(html).toContain('/jobs/job-gen-2/confirm/publish');
    expect(html).toContain('job-aaaa-00000001');
    expect(html).not.toContain('Bearer');
  });

  it('should_ask_before_cancel_and_publish', () => {
    const html = renderToStaticMarkup(
      createElement(JobPage, {
        job: {
          jobId: 'job-gen-3',
          kind: 'generate',
          state: 'preview',
          reason: null,
          documentType: 'document',
          contour: 'test-stand',
          profileVersionId: 'c6500866',
          publishedCount: 0,
          quarantineCount: 0,
          requestedCount: 2,
        },
        confirm: 'cancel',
        draftCount: 2,
      }),
    );
    expect(html).toContain('/jobs/job-gen-3/confirm/cancel');
    expect(html).toContain('Отменить задание?');
    expect(html).toContain('/jobs/job-gen-3/cancel');
    expect(html).toContain('method="post"');
  });

  it('should_ask_target_index_on_publish_confirm', () => {
    const html = renderToStaticMarkup(
      createElement(JobPage, {
        job: {
          jobId: 'job-gen-5',
          kind: 'generate',
          state: 'preview',
          reason: null,
          documentType: 'document',
          contour: 'test-stand',
          profileVersionId: 'c6500866',
          publishedCount: 0,
          quarantineCount: 0,
          requestedCount: 2,
          targetIndex: 'documents-synthetic',
        },
        confirm: 'publish',
        draftCount: 2,
      }),
    );
    expect(html).toContain('Опубликовать пачку на стенд?');
    expect(html).toContain('Целевой индекс');
    expect(html).toContain('name="targetIndex"');
    expect(html).toContain('id="publish-target-index"');
    expect(html).toContain('documents-synthetic');
    expect(html).toContain('/jobs/job-gen-5/publish');
    expect(html).not.toContain('id="generate-target-index"');
  });
});
