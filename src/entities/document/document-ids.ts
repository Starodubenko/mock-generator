import { createHash } from 'crypto';

export const deriveDocumentId = (jobId: string, number: number): string => {
  const hash = createHash('sha256').update(`${jobId}:${number}`).digest('hex');
  return `job-${hash.slice(0, 4)}-${String(number).padStart(8, '0')}`;
};

export const deriveLocalId = (
  jobId: string,
  number: number,
  path: string,
  itemIndex: number,
): string => {
  const hash = createHash('sha256')
    .update(`${jobId}:${number}:${path}:${itemIndex}`)
    .digest('hex');
  return `job-${hash.slice(0, 4)}-${String(number).padStart(8, '0')}-${hash.slice(4, 8)}`;
};

export const deriveItemId = (
  jobId: string,
  number: number,
  arrayPath: string,
  itemIndex: number,
): string =>
  deriveLocalId(jobId, number, `${arrayPath}:item`, itemIndex);

export const parseDerivedDocumentNumber = (id: string): number | null => {
  const match = /^job-[a-f0-9]{4}-(\d{8})(?:-[a-f0-9]{4})?$/.exec(id);
  if (!match?.[1]) {
    return null;
  }
  return Number.parseInt(match[1], 10);
};

export const isDocumentIdForJob = (jobId: string, id: string): boolean => {
  const number = parseDerivedDocumentNumber(id);
  return number !== null && deriveDocumentId(jobId, number) === id;
};
