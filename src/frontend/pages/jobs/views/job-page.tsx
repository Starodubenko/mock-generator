import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { JobLivePanel } from '@frontend/features/job-live/JobLivePanel';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { jobHelp } from '../config/job-help';
import { JobDraftDialog, type DraftRow } from '../ui/job-draft-dialog';

type Props = PageProps<{
  job: {
    jobId: string;
    kind: string;
    state: string;
    reason: string | null;
    documentType: string;
    contour: string;
    profileVersionId: string | null;
    profileVersionLabel?: string | null;
    publishedCount: number;
    quarantineCount: number;
    requestedCount: number | null;
    fieldConstraints?: Array<{
      path: string;
      kind: string;
      values: Array<string | boolean>;
    }>;
    targetIndex?: string | null;
  };
  viewData?: boolean;
  confirm?: 'cancel' | 'publish' | null;
  draftCount?: number;
  documents?: DraftRow[];
  aliasHref?: string | null;
}>;

export const JobPage: FC<Props> = (props) => {
  const {
    job,
    viewData = false,
    confirm = null,
    draftCount = 0,
    documents = [],
    aliasHref = null,
  } = props;
  return (
    <PageWithHelp markdown={jobHelp(job.jobId, job.kind)}>
      <PagePanel>
        <JobLivePanel
          job={job}
          confirm={confirm}
          draftCount={draftCount}
          aliasHref={aliasHref}
          draftDialog={(canPublish) => (
            <JobDraftDialog
              jobId={job.jobId}
              contour={job.contour}
              open={viewData}
              canPublish={canPublish}
              canSaveResource={job.kind === 'generate' && documents.length > 0}
              documents={documents}
            />
          )}
        />
      </PagePanel>
    </PageWithHelp>
  );
};

JobPage.displayName = 'JobPage';

export default JobPage;
