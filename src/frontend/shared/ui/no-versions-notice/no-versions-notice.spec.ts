import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NoVersionsNotice } from './no-versions-notice';

describe('NoVersionsNotice html', () => {
  it('should_link_to_train_tab_without_secrets', () => {
    const html = renderToStaticMarkup(
      createElement(NoVersionsNotice, {
        contour: 'test-stand',
        trainHref: '/profiles/document?contour=test-stand',
        description: 'Список появится после обучения.',
      }),
    );
    expect(html).toContain('Нет версий профиля');
    expect(html).toContain('Обучить');
    expect(html).toContain('href="/profiles/document?contour=test-stand"');
    expect(html).toContain('test-stand');
    expect(html).not.toContain('Bearer');
  });
});
