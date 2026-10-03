import { createHash } from 'crypto';
import type { PathStats } from './profile.types';
import {
  profileLinksOf,
  type ProfileLinkFields,
} from './profile-links';

export const computeProfileVersionId = (
  input: {
    documentType: string;
    contour: string;
    snapshotId: string;
    paths: PathStats[];
    aliases: Array<{ from: string; to: string }>;
  } & Partial<ProfileLinkFields>,
): string => {
  const links = profileLinksOf(input);
  const payload = JSON.stringify({
    documentType: input.documentType,
    contour: input.contour,
    snapshotId: input.snapshotId,
    paths: input.paths,
    aliases: input.aliases,
    ...links,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 8);
};
