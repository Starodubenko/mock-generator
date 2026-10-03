import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Stack, Typography } from '@mui/material';
import { JobListLive } from '@frontend/features/job-live/JobListLive';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { jobsHelp } from '../config/jobs-help';

type Props = PageProps<{
  contour: string;
  timeZone: string;
  jobs: Array<{
    jobId: string;
    kind: string;
    state: string;
    createdAt: string;
    documentType: string;
    requestedCount: number | null;
  }>;
}>;

export const JobListPage: FC<Props> = (props) => {
  const { contour, timeZone, jobs } = props;
  return (
    <PageWithHelp markdown={jobsHelp(contour)}>
      <PagePanel>
        <Stack spacing={2}>
          <Typography variant="h5">Задания ({contour})</Typography>
          <JobListLive contour={contour} timeZone={timeZone} jobs={jobs} />
        </Stack>
      </PagePanel>
    </PageWithHelp>
  );
};

JobListPage.displayName = 'JobListPage';

export default JobListPage;
