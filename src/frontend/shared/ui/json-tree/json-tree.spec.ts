import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonTree } from './json-tree';

describe('JsonTree html', () => {
  it('should_render_collapsible_object_and_array_without_wrapping_long_values', () => {
    const html = renderToStaticMarkup(
      createElement(JsonTree, {
        defaultOpen: true,
        value: [
          {
            id: 'job-aaaa-00000001',
            nested: { routeDirection: { group: 'A'.repeat(80) } },
            tags: ['one', 'two'],
          },
        ],
      }),
    );
    expect(html).toContain('data-json-tree');
    expect(html).toContain('data-json-node="array"');
    expect(html).toContain('data-json-node="object"');
    expect(html).toContain('[1]');
    expect(html).toContain('id');
    expect(html).toContain('&quot;job-aaaa-00000001&quot;');
    expect(html).toContain('routeDirection');
    expect(html).toContain('white-space:pre');
    expect(html).toContain('width:max-content');
    expect(html).toContain('<details');
    expect(html.match(/<details/g)?.length).toBeGreaterThan(1);
    expect(html.match(/open=""/g)?.length).toBeGreaterThan(1);
    expect(html).not.toContain('Bearer');
  });
});
