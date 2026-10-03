import {
  ConsoleLiveJobSubpath,
  isConsoleLiveJobSubpath,
} from '@frontend/entities/console-live/console-live.contract';

export const jobIdFromConsolePath = (pathname: string): string | null => {
  const match = pathname.match(/^\/jobs\/([^/]+)/);
  const jobId = match?.[1];
  if (!jobId || isConsoleLiveJobSubpath(jobId, ConsoleLiveJobSubpath.New)) {
    return null;
  }
  return jobId;
};

export const consoleLiveFallbackHref = (
  pathname: string,
  search: string,
  jobId: string,
): string => {
  if (jobIdFromConsolePath(pathname) === jobId) {
    return `${pathname}${search}`;
  }
  return `/jobs/${jobId}`;
};
