import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { TrainPage } from './train-page';

const documentTypes = [
  { documentType: 'document', enabled: true },
  { documentType: 'related', enabled: true },
];

describe('TrainPage html', () => {
  it('should_require_attached_corpus_files_and_not_echo_bodies', () => {
    const html = renderToStaticMarkup(
      createElement(TrainPage, {
        documentType: 'document',
        contour: 'test-stand',
        reason: null,
        sampleSize: '100',
        idempotencyKey: 'key-1',
        documentTypes,
      }),
    );
    expect(html).toContain('multipart/form-data');
    expect(html).toContain('type="file"');
    expect(html).toContain('name="corpus"');
    expect(html).toContain('Эталонные файлы');
    expect(html).toContain('Перетащите эталон сюда');
    expect(html).toContain('data-train-after-corpus');
    expect(html).toContain('например source.kind');
    expect(html).toContain('например kind');
    expect(html).toContain('data-field-hint');
    expect(html).toContain(FIELD_HINTS.sampleSize);
    expect(html).toContain(FIELD_HINTS.aliasFrom);
    expect(html).toContain(FIELD_HINTS.aliasTo);
    expect(html).toContain(FIELD_HINTS.corpus);
    expect(html).toContain(FIELD_HINTS.documentType);
    expect(html).not.toContain('Choose File');
    expect(html).not.toContain('sourceIndex');
    expect(html).not.toContain('Индекс-источник');
    expect(html).not.toContain('Bearer');
  });

  it('should_select_document_type_from_path_and_keep_switcher_off_the_train_post', () => {
    const html = renderToStaticMarkup(
      createElement(TrainPage, {
        documentType: 'related',
        contour: 'test-stand',
        reason: null,
        sampleSize: '100',
        idempotencyKey: 'key-1',
        documentTypes,
      }),
    );
    expect(html).toContain('id="train-document-type"');
    expect(html).toContain('data-kit-select');
    expect(html).toContain('data-submit-on-change="true"');
    expect(html).toContain('data-action-prefix="/profiles/"');
    expect(html).toContain('MuiMenuItem');
    expect(html).toContain('Тип документа');
    expect(html).toContain('document');
    expect(html).toContain('related');
    expect(html).toContain('data-kit-values="document,related"');
    expect(html).not.toMatch(/<select[\s>]/);
    expect(html).not.toContain('data-native-dropdown');
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/profiles/related/trainings"');
    expect(html).not.toContain('name="documentType"');
    expect(html).not.toContain('Bearer');
  });
});
