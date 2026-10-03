import type {
  CrossTypeLink,
  DateOrderInvariant,
  ParentChildInvariant,
  ProfileVersion,
  ValueEquality,
} from './profile.types';

export type ProfileLinkFields = {
  identifierPaths: string[];
  dateShiftPaths: string[];
  dateOrderInvariants: DateOrderInvariant[];
  parentChildInvariants: ParentChildInvariant[];
  valueEqualities: ValueEquality[];
  crossTypeLinks: CrossTypeLink[];
};

export const emptyProfileLinks = (): ProfileLinkFields => ({
  identifierPaths: [],
  dateShiftPaths: [],
  dateOrderInvariants: [],
  parentChildInvariants: [],
  valueEqualities: [],
  crossTypeLinks: [],
});

export const profileLinksOf = (
  version: Partial<ProfileLinkFields>,
): ProfileLinkFields => ({
  identifierPaths: version.identifierPaths ?? [],
  dateShiftPaths: version.dateShiftPaths ?? [],
  dateOrderInvariants: version.dateOrderInvariants ?? [],
  parentChildInvariants: version.parentChildInvariants ?? [],
  valueEqualities: version.valueEqualities ?? [],
  crossTypeLinks: version.crossTypeLinks ?? [],
});

export const withProfileLinks = (
  version: ProfileVersion,
  links: Partial<ProfileLinkFields>,
): ProfileVersion => ({
  ...version,
  ...profileLinksOf({ ...profileLinksOf(version), ...links }),
});
