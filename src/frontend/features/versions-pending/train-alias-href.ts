import {
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
  isConsoleLiveKind,
  isConsoleLiveState,
} from '@frontend/entities/console-live/console-live.contract';

export const trainAliasHrefFromLive = (input: {
  kind: string;
  state: string;
  contour: string;
  documentType: string;
  profileVersionId: string | null;
  jobId?: string | null;
  fallbackHref: string | null;
}): string | null => {
  if (
    isConsoleLiveKind(input.kind, ConsoleLiveJobKind.Train) &&
    isConsoleLiveState(input.state, ConsoleLiveJobState.Succeeded) &&
    input.profileVersionId
  ) {
    const params = new URLSearchParams({
      contour: input.contour,
      open: input.documentType,
      nameVersion: input.profileVersionId,
    });
    if (input.jobId) {
      params.set('nameJob', input.jobId);
    }
    return `/document-types?${params.toString()}`;
  }
  return input.fallbackHref;
};
