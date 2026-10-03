import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CorpusDropzone } from './CorpusDropzone';

describe('CorpusDropzone html', () => {
  it('should_render_hidden_corpus_input_inside_drop_label', () => {
    const html = renderToStaticMarkup(createElement(CorpusDropzone));
    expect(html).toContain('name="corpus"');
    expect(html).toContain('type="file"');
    expect(html).toContain('data-corpus-dropzone');
    expect(html).toContain('Перетащите эталон сюда');
    expect(html).toContain('data-field-hint');
    expect(html).toContain('.json, .ndjson или .jsonl');
    expect(html).not.toContain('Убрать файлы');
    expect(html).not.toContain('Choose File');
    expect(html).not.toContain('Bearer');
  });
});
