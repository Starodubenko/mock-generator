import { profileLinksOf } from '@entities/profile/profile-links';
import type { ProfileVersion } from '@entities/profile/profile.types';

type ProfileWire = Omit<ProfileVersion, 'corpusValueFingerprints'> & {
  corpusValueFingerprints: string[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const profileFromWire = (value: unknown): ProfileVersion | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const row = asRecord(value);
  if (typeof row.versionId !== 'string') {
    return undefined;
  }
  const fingerprints = Array.isArray(row.corpusValueFingerprints)
    ? row.corpusValueFingerprints.filter(
        (item): item is string => typeof item === 'string',
      )
    : [];
  return {
    ...(row as unknown as ProfileWire),
    ...profileLinksOf(row as ProfileWire),
    corpusValueFingerprints: new Set(fingerprints),
  };
};

export const profileToWire = (version: ProfileVersion): ProfileWire => ({
  ...version,
  corpusValueFingerprints: [...version.corpusValueFingerprints],
});
