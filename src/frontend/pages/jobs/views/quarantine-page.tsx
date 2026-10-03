import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Stack, Typography } from '@mui/material';
import { formatReason } from '@frontend/shared/i18n/ru-labels';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { quarantineHelp } from '../config/quarantine-help';

type Props = PageProps<{
  jobId: string;
  items: Array<{ documentId: string; reason: string }>;
}>;

export const QuarantinePage: FC<Props> = (props) => {
  const { jobId, items } = props;
  return (
    <PageWithHelp markdown={quarantineHelp()}>
      <PagePanel>
        <Stack spacing={1}>
          <Typography variant="h5">Карантин задания {jobId}</Typography>
          {items.length === 0 ? (
            <Typography variant="body2">Документов в карантине нет.</Typography>
          ) : null}
          {items.map((item) => (
            <Typography key={item.documentId}>
              {item.documentId}: {formatReason(item.reason)}
            </Typography>
          ))}
        </Stack>
      </PagePanel>
    </PageWithHelp>
  );
};

QuarantinePage.displayName = 'QuarantinePage';

export default QuarantinePage;
