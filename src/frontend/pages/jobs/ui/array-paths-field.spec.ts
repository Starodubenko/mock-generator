import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { AddArrayPathButton, ArrayPathsField } from './array-paths-field';

describe('ArrayPathsField html', () => {
  it('should_render_paths_and_add_controls', () => {
    const html = renderToStaticMarkup(
      createElement(ArrayPathsField, {
        paths: ['hits.hits'],
        draftPath: '',
      }),
    );
    expect(html).toContain('data-array-paths');
    expect(html).toContain('hits.hits');
    expect(html).toContain('name="draftArrayPath"');
    expect(html).toContain('name="confirmAddFromDraft"');
    expect(html).toContain('form="generate-nav"');
    expect(html).toContain('name="confirmRemoveArrayPath"');
    expect(html).toContain(FIELD_HINTS.arrayPaths);
    expect(html).toContain('data-array-paths-control');
    expect(html).toContain(FIELD_HINTS.addArrayPath);
    expect(html).toContain(FIELD_HINTS.removeArrayPath);
    expect(html).toContain('requestSubmit');
  });

  it('should_disable_duplicate_add', () => {
    const html = renderToStaticMarkup(
      createElement(AddArrayPathButton, {
        path: 'hits.hits',
        selected: true,
      }),
    );
    expect(html).toContain('disabled');
    expect(html).toContain('уже в списке');
    expect(html).toContain('name="confirmAddArrayPath"');
  });
});
