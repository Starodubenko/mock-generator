import { parseCorpusFiles } from '@entities/profile/parse-corpus-files';
import type { CorpusParseResult } from '@entities/profile/parse-corpus-files';

export type UploadedCorpusFile = {
  originalname: string;
  buffer: Buffer;
};

export const readUploadedCorpus = (
  files: UploadedCorpusFile[] | undefined,
): CorpusParseResult => {
  if (!files || files.length === 0) {
    return { ok: false, reason: 'empty_corpus' };
  }
  return parseCorpusFiles(
    files.map((file) => ({
      filename: file.originalname,
      text: file.buffer.toString('utf8'),
    })),
  );
};
