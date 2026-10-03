import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { linkKindHint } from './flatten-version-links';
import { VersionLinksTable } from './version-links-table';

describe('VersionLinksTable html', () => {
  it('should_explain_each_link_kind_and_wrap_in_details', () => {
    const html = renderToStaticMarkup(
      createElement(VersionLinksTable, {
        pathOptions: ['id', 'entityId'],
        links: {
          parentChildInvariants: [
            {
              parentPath: 'id',
              childPath: 'entityId',
              arrayPath: 'children',
            },
          ],
          valueEqualities: [{ scope: 'document', paths: ['id', 'docUuid'] }],
        },
      }),
    );
    expect(html).toContain('data-version-panel="links"');
    expect(html).toContain('<details');
    expect(html).toContain('Настройки связей');
    expect(html).toContain('data-link-kind-hint="parent-child"');
    expect(html).toContain('data-link-kind-hint="equality"');
    expect(html).toContain('data-field-hint');
    expect(html).toContain(linkKindHint('parent-child'));
    expect(html).toContain(linkKindHint('equality'));
    expect(html).toContain('Вид связи');
    expect(html).not.toContain('Bearer');
  });
});
