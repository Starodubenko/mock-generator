import type { ProfileDiff, ProfileVersion } from './profile.types';

export type DiffOptions = {
  shortWindowThreshold: number;
  presenceDropThreshold: number;
};

const DEFAULT_OPTIONS: DiffOptions = {
  shortWindowThreshold: 10,
  presenceDropThreshold: 0.05,
};

export const diffProfiles = (
  from: ProfileVersion | null,
  to: ProfileVersion,
  options: DiffOptions = DEFAULT_OPTIONS,
): ProfileDiff => {
  const fromPaths = new Map(from?.paths.map((item) => [item.path, item]) ?? []);
  const toPaths = new Map(to.paths.map((item) => [item.path, item]));
  const added: string[] = [];
  const removed: string[] = [];
  const typeChanged: string[] = [];
  const enumChanged: string[] = [];
  const aliasApplied: string[] = [];
  const rejected: string[] = [];
  const keptByHysteresis: string[] = [];
  const shortWindow = to.sampleDocumentCount < options.shortWindowThreshold;

  for (const [path, stats] of toPaths) {
    if (!fromPaths.has(path)) {
      added.push(path);
    }
    if (stats.pathClass === 'rejected') {
      rejected.push(path);
    }
  }
  for (const [path, fromStats] of fromPaths) {
    if (toPaths.has(path)) {
      continue;
    }
    if (shortWindow) {
      keptByHysteresis.push(path);
      continue;
    }
    if (fromStats.presenceRate > options.presenceDropThreshold) {
      keptByHysteresis.push(path);
      continue;
    }
    removed.push(path);
  }
  for (const [path, toStats] of toPaths) {
    const fromStats = fromPaths.get(path);
    if (!fromStats) {
      continue;
    }
    if (fromStats.pathClass !== toStats.pathClass) {
      typeChanged.push(path);
    }
    if (fromStats.categoryValues && toStats.categoryValues) {
      const lost = fromStats.categoryValues.filter(
        (value) => !toStats.categoryValues?.includes(value),
      );
      if (lost.length > 0 && shortWindow) {
        keptByHysteresis.push(path);
      } else if (
        fromStats.categoryValues.join() !== toStats.categoryValues.join()
      ) {
        enumChanged.push(path);
      }
    }
  }
  for (const alias of to.aliases) {
    if (fromPaths.has(alias.from) && toPaths.has(alias.to)) {
      aliasApplied.push(`${alias.from}->${alias.to}`);
    }
  }

  return {
    fromVersionId: from?.versionId ?? '',
    toVersionId: to.versionId,
    added,
    removed,
    typeChanged,
    enumChanged,
    aliasApplied,
    rejected,
    keptByHysteresis,
  };
};
