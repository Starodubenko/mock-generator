import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HoverTip } from './hover-tip';

describe('HoverTip html', () => {
  it('should_render_tooltip_text_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(HoverTip, {
        text: 'Пояснение чипа',
        tooltipId: 'tip-1',
        children: 'chip',
      }),
    );
    expect(html).toContain('data-hover-tip');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('Пояснение чипа');
    expect(html).toContain('id="tip-1"');
    expect(html).toContain('chip');
    expect(html).not.toContain('Bearer');
  });
});
