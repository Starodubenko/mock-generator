export type CorpusParseOk = { ok: true; documents: Record<string, unknown>[] };
export type CorpusParseFail = {
  ok: false;
  reason: 'empty_corpus' | 'validation_error';
};
export type CorpusParseResult = CorpusParseOk | CorpusParseFail;

export type CorpusFileInput = {
  filename: string;
  text: string;
};

export const isCorpusFilename = (filename: string): boolean =>
  /\.(json|ndjson|jsonl)$/i.test(filename);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asDocumentList = (value: unknown): CorpusParseResult => {
  if (isPlainObject(value)) {
    return { ok: true, documents: [value] };
  }
  if (!Array.isArray(value)) {
    return { ok: false, reason: 'validation_error' };
  }
  const documents: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) {
      return { ok: false, reason: 'validation_error' };
    }
    documents.push(item);
  }
  if (documents.length === 0) {
    return { ok: false, reason: 'empty_corpus' };
  }
  return { ok: true, documents };
};

const sourceFromHit = (
  hit: Record<string, unknown>,
  fallbackId: string,
): { id: string; body: Record<string, unknown> } => {
  const source = isPlainObject(hit._source) ? hit._source : hit;
  const id =
    typeof source.id === 'string'
      ? source.id
      : typeof hit._id === 'string'
        ? hit._id
        : fallbackId;
  return { id, body: source };
};

export const indexDocumentsFromGeneratedBody = (
  body: Record<string, unknown>,
  fallbackId: string,
): Array<{ id: string; body: Record<string, unknown> }> => {
  const hitsRoot = isPlainObject(body.hits) ? body.hits : null;
  if (hitsRoot && Array.isArray(hitsRoot.hits)) {
    const documents: Array<{ id: string; body: Record<string, unknown> }> = [];
    hitsRoot.hits.forEach((hit, index) => {
      if (!isPlainObject(hit)) {
        return;
      }
      documents.push(sourceFromHit(hit, `${fallbackId}-${index}`));
    });
    return documents.length > 0 ? documents : [{ id: fallbackId, body }];
  }
  if (isPlainObject(body._source)) {
    return [sourceFromHit(body, fallbackId)];
  }
  return [{ id: fallbackId, body }];
};

export const corpusSampleCount = (
  documents: Record<string, unknown>[],
): number =>
  documents.reduce(
    (sum, body) => sum + indexDocumentsFromGeneratedBody(body, 'sample').length,
    0,
  );

const parseNdjson = (text: string): CorpusParseResult => {
  const documents: Record<string, unknown>[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(line);
      if (!isPlainObject(parsed)) {
        return { ok: false, reason: 'validation_error' };
      }
      documents.push(parsed);
    } catch {
      return { ok: false, reason: 'validation_error' };
    }
  }
  if (documents.length === 0) {
    return { ok: false, reason: 'empty_corpus' };
  }
  return { ok: true, documents };
};

export const parseCorpusFile = (
  filename: string,
  text: string,
): CorpusParseResult => {
  if (!isCorpusFilename(filename)) {
    return { ok: false, reason: 'validation_error' };
  }
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty_corpus' };
  }
  if (trimmed.startsWith('[')) {
    try {
      return asDocumentList(JSON.parse(trimmed));
    } catch {
      return { ok: false, reason: 'validation_error' };
    }
  }
  try {
    return asDocumentList(JSON.parse(trimmed));
  } catch {
    return parseNdjson(trimmed);
  }
};

export const parseCorpusFiles = (
  files: CorpusFileInput[],
): CorpusParseResult => {
  if (files.length === 0) {
    return { ok: false, reason: 'empty_corpus' };
  }
  const documents: Record<string, unknown>[] = [];
  for (const file of files) {
    const parsed = parseCorpusFile(file.filename, file.text);
    if (!parsed.ok) {
      return parsed;
    }
    documents.push(...parsed.documents);
  }
  if (documents.length === 0) {
    return { ok: false, reason: 'empty_corpus' };
  }
  return { ok: true, documents };
};
