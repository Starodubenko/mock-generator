import { readUploadedCorpus } from './read-uploaded-corpus';

describe('readUploadedCorpus', () => {
  it('should_parse_attached_json', () => {
    const result = readUploadedCorpus([
      {
        originalname: 'ref.json',
        buffer: Buffer.from(JSON.stringify([{ status: 'NEW' }])),
      },
    ]);
    expect(result).toEqual({ ok: true, documents: [{ status: 'NEW' }] });
  });

  it('should_fail_without_files', () => {
    expect(readUploadedCorpus(undefined)).toEqual({
      ok: false,
      reason: 'empty_corpus',
    });
  });
});
