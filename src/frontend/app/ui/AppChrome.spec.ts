import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppChrome, uniqueContours } from './AppChrome';

describe('uniqueContours', () => {
  it('should_not_repeat_current_contour', () => {
    expect(uniqueContours(['test-stand'], 'test-stand')).toEqual([
      'test-stand',
    ]);
  });

  it('should_keep_current_if_missing_from_list', () => {
    expect(uniqueContours(['test-stand'], 'dev')).toEqual([
      'test-stand',
      'dev',
    ]);
  });
});

describe('AppChrome html', () => {
  it('should_render_one_mui_select_without_native_select', () => {
    const html = renderToStaticMarkup(
      createElement(AppChrome, {
        contour: 'test-stand',
        contours: ['test-stand'],
        currentPath: '/',
        toast: null,
        children: 'ok',
      }),
    );
    expect(html).toContain('data-kit-select');
    expect(html).toContain('data-submit-on-change="true"');
    expect(html).toContain('MuiMenuItem');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('id="contour-select"');
    expect(html).toContain('name="contour"');
    expect(html).not.toMatch(/<select[\s>]/);
    expect(html).not.toContain('data-native-dropdown');
    expect(html).not.toContain('MuiInputLabel');
    expect(html).not.toContain('MuiContainer');
    expect(html).toContain('Разделы пульта');
    expect(html).toContain('data-field-hint');
    expect(html).toContain('Стенд, в котором идут обучение');
    expect(html).toContain('data-active-version-watch');
    expect(html).toContain('Тип документа');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });

  it('should_embed_active_catalog_snapshot', () => {
    const html = renderToStaticMarkup(
      createElement(AppChrome, {
        contour: 'test-stand',
        contours: ['test-stand'],
        currentPath: '/',
        toast: null,
        activeCatalog: {
          contour: 'test-stand',
          items: [
            {
              documentType: 'document',
              activeVersionId: '3bfbf9eb',
              activeVersionLabel: 'стенд',
            },
          ],
        },
        children: 'ok',
      }),
    );
    expect(html).toContain('3bfbf9eb');
    expect(html).toContain('document');
    expect(html).toContain('data-active-version-snapshot');
  });

  it('should_render_success_toast_copy', () => {
    const html = renderToStaticMarkup(
      createElement(AppChrome, {
        contour: 'test-stand',
        contours: ['test-stand'],
        currentPath: '/',
        toast: 'training_started',
        children: 'ok',
      }),
    );
    expect(html).toContain('Обучение принято');
    expect(html).toContain('data-console-toast-host');
  });
});
