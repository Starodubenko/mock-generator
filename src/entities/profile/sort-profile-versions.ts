export type VersionRecency = {
  versionId: string;
  createdAt: string;
};

const createdAtMs = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
};

export const compareProfileVersionRecency = (
  left: VersionRecency,
  right: VersionRecency,
): number => {
  const byDate = createdAtMs(right.createdAt) - createdAtMs(left.createdAt);
  if (byDate !== 0) {
    return byDate;
  }
  return right.versionId.localeCompare(left.versionId);
};

export const sortProfileVersionsByCreatedAt = <T extends VersionRecency>(
  items: T[],
): T[] => [...items].sort(compareProfileVersionRecency);
