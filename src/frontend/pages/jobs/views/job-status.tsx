import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { JobStatusSegment } from '@frontend/features/job-status-poll/JobStatusSegment';

type Props = PageProps<{
  job: {
    jobId: string;
    state: string;
    reason: string | null;
    aliasHref?: string | null;
  };
}>;

export const JobStatus: FC<Props> = (props) => {
  const { job } = props;
  return (
    <JobStatusSegment
      jobId={job.jobId}
      state={job.state}
      reason={job.reason}
      succeededHref={job.aliasHref}
    />
  );
};

JobStatus.displayName = 'JobStatus';

export default JobStatus;
