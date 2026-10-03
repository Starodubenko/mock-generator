import { formatFileSize, isCorpusFile, pickCorpusFiles } from './corpus-files';

describe('corpus files', () => {
  it('should_accept_json_ndjson_and_jsonl_names', () => {
    expect(isCorpusFile({ name: 'a.json', type: '' })).toBe(true);
    expect(isCorpusFile({ name: 'b.ndjson', type: '' })).toBe(true);
    expect(isCorpusFile({ name: 'c.jsonl', type: '' })).toBe(true);
    expect(isCorpusFile({ name: 'd.txt', type: 'application/json' })).toBe(
      true,
    );
    expect(isCorpusFile({ name: 'e.txt', type: 'text/plain' })).toBe(false);
  });

  it('should_keep_first_ten_corpus_files', () => {
    const files = Array.from({ length: 12 }, (_, index) => ({
      name: `doc-${index}.json`,
      type: 'application/json',
    }));
    expect(pickCorpusFiles(files)).toHaveLength(10);
    expect(pickCorpusFiles(files)[0]?.name).toBe('doc-0.json');
  });

  it('should_format_sizes_without_reading_bodies', () => {
    expect(formatFileSize(400)).toBe('400 Б');
    expect(formatFileSize(2048)).toBe('2 КБ');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 МБ');
  });
});
