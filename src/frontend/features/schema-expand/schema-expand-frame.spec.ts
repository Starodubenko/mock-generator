import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SEED_FIELD_LABEL } from '@frontend/shared/i18n/field-hints';
import { SchemaExpandFrame } from './schema-expand-frame';
import { SCHEMA_EXPAND_RUNTIME } from './schema-expand-runtime';

describe('SchemaExpandFrame html', () => {
  it('should_render_expand_chrome_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaExpandFrame, {
        versionLabel: 'abcd1234 — стенд (активна)',
        seed: 'stand-24',
        count: '10',
        children: 'tree',
      }),
    );
    expect(html).toContain('data-schema-expand');
    expect(html).toContain('data-schema-expand-body');
    expect(html).toContain('data-schema-expand-main');
    expect(html).toContain('flex:1');
    expect(html).toContain('aria-label="Развернуть"');
    expect(html).toContain('Развернуть');
    expect(html).toContain('Закрыть');
    expect(html).toContain('type="button"');
    expect(html).toContain('Запустить задание');
    expect(html).toContain('abcd1234 — стенд (активна)');
    expect(html).toContain('stand-24');
    expect(html).not.toContain('documents-synthetic');
    expect(html).not.toContain('Индекс');
    expect(html).toContain(SEED_FIELD_LABEL);
    expect(html).toContain('data-schema-expand-value="version"');
    expect(html).toContain(SCHEMA_EXPAND_RUNTIME);
    expect(html).toContain('tree');
    expect(html).not.toContain('data-schema-expand-split=""');
    expect(html).not.toContain('data-schema-expand-aside=""');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });

  it('should_render_aside_as_a_second_column_slot', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaExpandFrame, {
        chips: [{ label: 'Версия', value: 'ver-1', field: 'version' }],
        aside: 'links',
        children: 'tree',
      }),
    );
    expect(html).toContain('data-schema-expand-split=""');
    expect(html).toContain('data-schema-expand-aside=""');
    expect(html).toContain('data-version-panel="schema"');
    expect(html).toContain('data-version-scroll');
    expect(html).toContain('links');
    expect(html.indexOf('tree')).toBeLessThan(html.indexOf('links'));
    expect(html).toContain('flex-direction:row');
    expect(html).toContain('[data-version-panel-body]{');
    expect(html).toContain('overflow:auto');
  });
});

describe('SCHEMA_EXPAND_RUNTIME', () => {
  it('should_read_live_form_values_and_toggle', () => {
    expect(SCHEMA_EXPAND_RUNTIME).toContain('generate-seed');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('generate-count');
    expect(SCHEMA_EXPAND_RUNTIME).not.toContain('generate-target-index');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('profile-version-select');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('data-open');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('data-schema-expand-open');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('closest');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('overflow');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('100dvh');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('getBoundingClientRect');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('data-version-panel');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('stopPropagation');
    expect(SCHEMA_EXPAND_RUNTIME).toContain('Escape');
    expect(SCHEMA_EXPAND_RUNTIME).not.toContain('Bearer');
  });
});
