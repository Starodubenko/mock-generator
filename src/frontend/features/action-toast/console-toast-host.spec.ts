import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsoleToastHost } from './console-toast-host';
import { CONSOLE_TOAST_RUNTIME } from './console-toast-runtime';
import {
  CONSOLE_TOAST_ERROR_MS,
  CONSOLE_TOAST_SUCCESS_MS,
} from './console-toast-timing';

describe('ConsoleToastHost html', () => {
  it('should_render_initial_toast_copy', () => {
    const html = renderToStaticMarkup(
      createElement(ConsoleToastHost, { toast: 'training_started' }),
    );
    expect(html).toContain('data-console-toast-host');
    expect(html).toContain('Обучение принято');
    expect(html).toContain('Версия появится на карточке задания');
    expect(html).toContain('Закрыть уведомление');
  });

  it('should_append_share_path_for_saved_mock_resource', () => {
    const html = renderToStaticMarkup(
      createElement(ConsoleToastHost, {
        toast: 'mock_resource_saved',
        sharePath: '/api/tasks',
      }),
    );
    expect(html).toContain('Ресурс сохранён');
    expect(html).toContain('/api/tasks');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });

  it('should_keep_toasts_visible_longer_and_restore_after_remount', () => {
    expect(CONSOLE_TOAST_SUCCESS_MS).toBe(15_000);
    expect(CONSOLE_TOAST_ERROR_MS).toBe(0);
    expect(CONSOLE_TOAST_RUNTIME).toContain(String(CONSOLE_TOAST_SUCCESS_MS));
    expect(CONSOLE_TOAST_RUNTIME).toContain(String(CONSOLE_TOAST_ERROR_MS));
    expect(CONSOLE_TOAST_RUNTIME).toContain('sessionStorage');
    expect(CONSOLE_TOAST_RUNTIME).not.toContain('currentScript');
    expect(CONSOLE_TOAST_RUNTIME).not.toContain('5600');
    expect(CONSOLE_TOAST_RUNTIME).toContain(
      "el.required && !String(el.value || '')",
    );
  });
});
