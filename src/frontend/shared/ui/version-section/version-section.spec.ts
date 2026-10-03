import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VersionSection } from './version-section';

describe('VersionSection html', () => {
  it('should_render_open_details_with_chevron', () => {
    const html = renderToStaticMarkup(
      createElement(VersionSection, {
        title: 'Схема документа',
        panel: 'schema',
        extra: 'extra',
        children: 'tree',
      }),
    );
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toContain('data-version-panel="schema"');
    expect(html).toContain('data-version-panel-summary');
    expect(html).toContain('data-version-panel-chevron');
    expect(html).toContain('display:none');
    expect(html).toContain('Схема документа');
    expect(html).toContain('extra');
    expect(html).toContain('tree');
    expect(html).not.toContain('Bearer');
  });
});
