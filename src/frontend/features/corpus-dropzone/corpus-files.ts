export const CORPUS_ACCEPT = '.json,.ndjson,.jsonl,application/json';
export const CORPUS_MAX_FILES = 10;

export type CorpusFileLike = {
  name: string;
  type: string;
};

export const isCorpusFile = (file: CorpusFileLike): boolean => {
  const lower = file.name.toLowerCase();
  if (
    lower.endsWith('.json') ||
    lower.endsWith('.ndjson') ||
    lower.endsWith('.jsonl')
  ) {
    return true;
  }
  return file.type === 'application/json';
};

export const pickCorpusFiles = <T extends CorpusFileLike>(
  files: Iterable<T>,
  maxCount = CORPUS_MAX_FILES,
): T[] => {
  const picked: T[] = [];
  for (const file of files) {
    if (!isCorpusFile(file)) {
      continue;
    }
    picked.push(file);
    if (picked.length >= maxCount) {
      break;
    }
  }
  return picked;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};
