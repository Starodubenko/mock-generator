import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog html', () => {
  it('should_render_post_confirm_and_back_link', () => {
    const html = renderToStaticMarkup(
      createElement(ConfirmDialog, {
        open: true,
        title: 'Отменить задание?',
        description: 'Задание остановится.',
        actionLabel: 'Отменить задание',
        action: '/jobs/job-1/cancel',
        cancelHref: '/jobs/job-1',
        danger: true,
      }),
    );
    expect(html).toContain('Отменить задание?');
    expect(html).toContain('/jobs/job-1/cancel');
    expect(html).toContain('method="post"');
    expect(html).toContain('/jobs/job-1');
    expect(html).toContain('Назад');
    expect(html).not.toContain('Bearer');
  });

  it('should_render_children_inside_the_form', () => {
    const html = renderToStaticMarkup(
      createElement(
        ConfirmDialog,
        {
          open: true,
          title: 'Опубликовать пачку на стенд?',
          description: 'Укажите индекс.',
          actionLabel: 'Опубликовать',
          action: '/jobs/job-1/publish',
          cancelHref: '/jobs/job-1/data',
          noValidate: true,
        },
        createElement('input', { name: 'targetIndex', defaultValue: 'idx' }),
      ),
    );
    expect(html).toContain('name="targetIndex"');
    expect(html).toContain('noValidate=""');
    expect(html).toContain('/jobs/job-1/publish');
  });

  it('should_allow_get_confirm', () => {
    const html = renderToStaticMarkup(
      createElement(ConfirmDialog, {
        open: true,
        title: 'Добавить путь?',
        description: 'hits.hits',
        actionLabel: 'Добавить',
        action: '/jobs/new',
        cancelHref: '/jobs/new',
        method: 'get',
        hiddenFields: [{ name: 'arrayPath', value: 'hits.hits' }],
      }),
    );
    expect(html).toContain('method="get"');
    expect(html).toContain('name="arrayPath"');
    expect(html).toContain('hits.hits');
  });

  it('should_render_nothing_when_closed', () => {
    const html = renderToStaticMarkup(
      createElement(ConfirmDialog, {
        open: false,
        title: 'Скрыто',
        description: 'Нет',
        actionLabel: 'Да',
        action: '/x',
        cancelHref: '/y',
      }),
    );
    expect(html).toBe('');
  });
});
