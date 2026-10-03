export type RankedJob = {
  jobId: string;
  createdAt: string;
};

const createdAtMs = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

export const rankJobs = <T extends RankedJob>(items: T[]): T[] =>
  [...items].sort((left, right) => {
    const byDate = createdAtMs(right.createdAt) - createdAtMs(left.createdAt);
    if (byDate !== 0) {
      return byDate;
    }
    return right.jobId.localeCompare(left.jobId);
  });

export const JOB_LIST_PAGE_SIZES = [10, 20, 50] as const;

export const JOB_LIST_DEFAULT_PAGE_SIZE = 10;

export const clampJobListPage = (
  page: number,
  count: number,
  pageSize: number,
): number => {
  const last = Math.max(0, Math.ceil(count / pageSize) - 1);
  return Math.min(Math.max(0, page), last);
};

export const sliceJobListPage = <T>(
  items: T[],
  page: number,
  pageSize: number,
): T[] => {
  const start = clampJobListPage(page, items.length, pageSize) * pageSize;
  return items.slice(start, start + pageSize);
};
