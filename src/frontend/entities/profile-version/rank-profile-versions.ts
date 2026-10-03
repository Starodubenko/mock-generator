export type RankedVersion = {
  versionId: string;
  createdAt: string;
};

const createdAtMs = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
};

export const rankProfileVersions = <T extends RankedVersion>(items: T[]): T[] =>
  [...items].sort((left, right) => {
    const byDate = createdAtMs(right.createdAt) - createdAtMs(left.createdAt);
    if (byDate !== 0) {
      return byDate;
    }
    return right.versionId.localeCompare(left.versionId);
  });
