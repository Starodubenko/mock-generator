import { CORPUS_DROPZONE_RUNTIME } from './corpus-dropzone-runtime';

describe('corpus dropzone runtime', () => {
  it('should_write_file_names_with_text_content_not_html', () => {
    expect(CORPUS_DROPZONE_RUNTIME).toContain('name="corpus"');
    expect(CORPUS_DROPZONE_RUNTIME).toContain('textContent = file.name');
    expect(CORPUS_DROPZONE_RUNTIME).toContain("textContent = 'Удалить'");
    expect(CORPUS_DROPZONE_RUNTIME).not.toContain('innerHTML = file');
  });
});
