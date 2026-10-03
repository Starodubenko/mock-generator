import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActiveVersionWatch } from './active-version-watch';
import { ACTIVE_VERSION_WATCH_RUNTIME } from './active-version-watch-runtime';

describe('ActiveVersionWatch html', () => {
  it('should_render_hidden_alert_table_and_snapshot', () => {
    const html = renderToStaticMarkup(
      createElement(ActiveVersionWatch, {
        snapshot: {
          contour: 'test-stand',
          ready: true,
          items: [
            {
              documentType: 'document',
              title: 'document',
              versionId: 'abc12345',
              caption: 'abc12345 — стенд',
            },
          ],
        },
      }),
    );
    expect(html).toContain('data-active-version-watch');
    expect(html).toContain('data-active-version-dialog');
    expect(html).toContain('data-open="false"');
    expect(html).toContain('Тип документа');
    expect(html).toContain('Было');
    expect(html).toContain('Стало');
    expect(html).toContain('Изменились активные версии');
    expect(html).toContain('Понятно');
    expect(html).toContain('data-active-version-snapshot');
    expect(html).toContain('abc12345');
    expect(html).toContain('document');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
    expect(html).toContain(ACTIVE_VERSION_WATCH_RUNTIME);
  });
});

describe('ACTIVE_VERSION_WATCH_RUNTIME', () => {
  it('should_skip_empty_catalog_and_first_visit', () => {
    expect(ACTIVE_VERSION_WATCH_RUNTIME).toContain(
      'snapshot.items.length === 0',
    );
    expect(ACTIVE_VERSION_WATCH_RUNTIME).toContain(
      'previous === null || previous.length === 0',
    );
    expect(ACTIVE_VERSION_WATCH_RUNTIME).toContain('data-active-version-open');
    expect(ACTIVE_VERSION_WATCH_RUNTIME).toContain('__activeVersionWatchPage');
    expect(ACTIVE_VERSION_WATCH_RUNTIME).not.toContain('document.currentScript');
  });
});
