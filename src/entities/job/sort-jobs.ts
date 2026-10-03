export type JobRecency = {
  jobId: string;
  createdAt: string;
};

const createdAtMs = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
};

export const compareJobRecency = (
  left: JobRecency,
  right: JobRecency,
): number => {
  const byDate = createdAtMs(right.createdAt) - createdAtMs(left.createdAt);
  if (byDate !== 0) {
    return byDate;
  }
  return right.jobId.localeCompare(left.jobId);
};

export const sortJobsByCreatedAt = <T extends JobRecency>(items: T[]): T[] =>
  [...items].sort(compareJobRecency);
