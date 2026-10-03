import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { generateJobHref, HomePage } from './home-page';

const baseProps = {
  contours: [{ contour: 'test-stand', timeZone: 'Europe/Moscow' }],
  documentTypes: [
    {
      documentType: 'document',
      activeVersionId: 'abcd' as string | null,
      activeVersionLabel: 'стенд',
    },
  ],
  contour: 'test-stand',
};

describe('generateJobHref', () => {
  it('should_pass_active_version_and_type', () => {
    expect(
      generateJobHref('test-stand', {
        documentType: 'document',
        activeVersionId: 'f3cb07be',
        activeVersionLabel: 'йцуей',
      }),
    ).toBe(
      '/jobs/new?contour=test-stand&documentType=document&profileVersionId=f3cb07be',
    );
  });

  it('should_omit_version_when_type_has_none', () => {
    expect(
      generateJobHref('test-stand', {
        documentType: 'related',
        activeVersionId: null,
        activeVersionLabel: null,
      }),
    ).toBe('/jobs/new?contour=test-stand&documentType=related');
  });
});

describe('HomePage html', () => {
  it('should_not_contain_corpus_pii_or_bearer', () => {
    const html = renderToStaticMarkup(createElement(HomePage, baseProps));
    expect(html).toContain('Пульт оператора');
    expect(html).not.toContain('Bearer');
    expect(html).not.toContain('INDEXER_BASE_URL');
  });

  it('should_render_created_types_with_current_version', () => {
    const html = renderToStaticMarkup(createElement(HomePage, baseProps));
    expect(html).not.toContain('Рабочий профиль');
    expect(html).not.toContain('Действия');
    expect(html).not.toContain('Доступные контуры');
    expect(html).not.toContain('href="/?contour=');
    expect(html).toContain('Типы документов');
    expect(html).toContain('data-section-scroll');
    expect(html).toContain('abcd — стенд');
    expect(html).toContain('Обучить профиль');
    expect(html).toContain('href="/profiles/document?contour=test-stand"');
    expect(html).toContain('/document-types?contour=test-stand');
    expect(html).toContain('open=document');
    expect(html).toContain('Сгенерировать');
    expect(html).toContain(
      '/jobs/new?contour=test-stand&amp;documentType=document&amp;profileVersionId=abcd',
    );
    expect(html).not.toContain('отключён');
    expect(html).toContain('Инструкция');
    expect(html).toContain('С чего начать');
    expect(html).not.toContain('**важно**');
  });

  it('should_show_empty_types_and_contour_states', () => {
    const html = renderToStaticMarkup(
      createElement(HomePage, {
        ...baseProps,
        documentTypes: [],
        contours: [],
      }),
    );
    expect(html).toContain('Типов ещё нет');
    expect(html).toContain('Публикация запрещена');
    expect(html).not.toContain('Рабочей версии нет');
  });
});
