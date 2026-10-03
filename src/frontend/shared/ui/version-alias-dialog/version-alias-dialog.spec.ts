import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VersionAliasDialog } from './version-alias-dialog';

describe('VersionAliasDialog html', () => {
  it('should_post_label_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(VersionAliasDialog, {
        open: true,
        versionId: 'v1',
        action: '/profiles/document/versions/v1/alias',
        cancelHref: '/profiles/document/versions?contour=test-stand',
        contour: 'test-stand',
      }),
    );
    expect(html).toContain('name="label"');
    expect(html).toContain('data-field-hint');
    expect(html).toContain('Короткое имя версии');
    expect(html).toContain('/profiles/document/versions/v1/alias');
    expect(html).toContain('Пропустить');
    expect(html).not.toContain('Bearer');
  });
});
