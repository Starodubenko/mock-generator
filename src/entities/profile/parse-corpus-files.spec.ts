import {
  corpusSampleCount,
  indexDocumentsFromGeneratedBody,
  parseCorpusFile,
  parseCorpusFiles,
} from './parse-corpus-files';

describe('parseCorpusFiles', () => {
  it('should_read_json_array_and_ndjson', () => {
    const json = parseCorpusFile(
      'a.json',
      JSON.stringify([{ status: 'NEW' }, { status: 'ERROR' }]),
    );
    expect(json).toEqual({
      ok: true,
      documents: [{ status: 'NEW' }, { status: 'ERROR' }],
    });
    const ndjson = parseCorpusFile('b.ndjson', '{"id":"1"}\n{"id":"2"}\n');
    expect(ndjson).toEqual({ ok: true, documents: [{ id: '1' }, { id: '2' }] });
  });

  it('should_reject_empty_or_unknown_extension', () => {
    expect(parseCorpusFiles([])).toEqual({ ok: false, reason: 'empty_corpus' });
    expect(parseCorpusFile('notes.txt', '[{"a":1}]')).toEqual({
      ok: false,
      reason: 'validation_error',
    });
    expect(parseCorpusFile('empty.json', '[]')).toEqual({
      ok: false,
      reason: 'empty_corpus',
    });
  });

  it('should_keep_opensearch_search_envelope_as_one_document', () => {
    const exportBody = {
      took: 14,
      timed_out: false,
      _shards: { total: 19, successful: 19, skipped: 0, failed: 0 },
      hits: {
        total: { value: 35, relation: 'eq' },
        max_score: 1,
        hits: [
          { _id: 'p1', _source: { createdAt: '2026-01-01' } },
          { _id: 'p2', _source: { id: 'keep', createdAt: '2026-01-02' } },
        ],
      },
    };
    const parsed = parseCorpusFile('hits.json', JSON.stringify(exportBody));
    expect(parsed).toEqual({ ok: true, documents: [exportBody] });
  });

  it('should_take_source_documents_from_generated_search_export', () => {
    expect(
      indexDocumentsFromGeneratedBody(
        {
          took: 1,
          hits: {
            hits: [
              { _id: 'p1', _source: { id: 'p1', createdAt: '2026-01-01' } },
            ],
          },
        },
        'fallback',
      ),
    ).toEqual([{ id: 'p1', body: { id: 'p1', createdAt: '2026-01-01' } }]);
  });

  it('should_count_search_hits_as_corpus_samples', () => {
    expect(
      corpusSampleCount([
        {
          took: 1,
          hits: {
            hits: [{ _source: { id: 'a' } }, { _source: { id: 'b' } }],
          },
        },
      ]),
    ).toBe(2);
  });
});
