export type TrainAliasJob = {
  documentType: string;
  contour: string;
  state: string;
  profileVersionId: string | null;
};

export const resolveTrainAliasPrompt = (input: {
  queryNameVersion: string | null;
  openType: string | null;
  contour: string;
  versions: Array<{ versionId: string; label: string | null }>;
  job: TrainAliasJob | null;
}): { nameVersion: string | null; pending: boolean } => {
  const { queryNameVersion, openType, contour, versions, job } = input;
  const labeled = (versionId: string | null): boolean =>
    Boolean(
      versionId && versions.find((item) => item.versionId === versionId)?.label,
    );
  if (
    job &&
    openType &&
    job.documentType === openType &&
    job.contour === contour
  ) {
    if (job.profileVersionId) {
      if (!labeled(job.profileVersionId)) {
        return { nameVersion: job.profileVersionId, pending: false };
      }
      return { nameVersion: null, pending: false };
    }
    if (
      job.state !== 'failed' &&
      job.state !== 'cancelled' &&
      job.state !== 'succeeded'
    ) {
      return { nameVersion: queryNameVersion, pending: true };
    }
  }
  if (queryNameVersion && !labeled(queryNameVersion)) {
    return { nameVersion: queryNameVersion, pending: false };
  }
  return { nameVersion: null, pending: false };
};
