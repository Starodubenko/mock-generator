'use client';

import type { ChangeEvent, FC } from 'react';
import { useEffect, useState } from 'react';
import {
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { applyJobListLiveEvent } from '@frontend/entities/job/apply-job-list-live-event';
import {
  JOB_LIST_DEFAULT_PAGE_SIZE,
  JOB_LIST_PAGE_SIZES,
  clampJobListPage,
  rankJobs,
  sliceJobListPage,
} from '@frontend/entities/job/rank-jobs';
import { VersionCreatedAt } from '@frontend/entities/profile-version/ui/version-created-at';
import {
  formatDocumentType,
  formatJobKind,
  formatJobState,
} from '@frontend/shared/i18n/ru-labels';
import { subscribeConsoleLive } from '../console-live/connection/console-live.bus';

type JobRow = {
  jobId: string;
  kind: string;
  state: string;
  createdAt: string;
  documentType: string;
  requestedCount: number | null;
};

type Props = {
  contour: string;
  timeZone: string;
  jobs: JobRow[];
};

const stateColor = (
  state: string,
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  if (state === 'succeeded') {
    return 'success';
  }
  if (state === 'failed') {
    return 'error';
  }
  if (state === 'preview') {
    return 'info';
  }
  if (state === 'canary' || state === 'running') {
    return 'warning';
  }
  return 'default';
};

export const JobListLive: FC<Props> = (props) => {
  const { contour, timeZone, jobs } = props;
  const [rows, setRows] = useState(() => rankJobs(jobs));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(JOB_LIST_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setRows(rankJobs(jobs));
    setPage(0);
  }, [jobs]);

  useEffect(() => {
    return subscribeConsoleLive((event) => {
      setRows((current) => {
        const next = applyJobListLiveEvent(current, event, contour);
        if (next.isNew) {
          setPage(0);
        }
        return next.rows;
      });
    });
  }, [contour]);

  const safePage = clampJobListPage(page, rows.length, rowsPerPage);
  const visible = sliceJobListPage(rows, safePage, rowsPerPage);

  return (
    <Stack spacing={1} sx={{ minHeight: 0, flex: 1 }}>
      <Typography
        variant="body2"
        sx={{ display: rows.length === 0 ? undefined : 'none' }}
      >
        Заданий пока нет.
      </Typography>
      <TableContainer
        sx={{
          display: rows.length === 0 ? 'none' : undefined,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Задание</TableCell>
              <TableCell>Вид и состояние</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell align="right">Запрошено</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((job) => (
              <TableRow key={job.jobId} hover>
                <TableCell sx={{ minWidth: 220 }}>
                  <Stack spacing={0.25}>
                    <VersionCreatedAt
                      createdAt={job.createdAt}
                      timeZone={timeZone}
                    />
                    <Link
                      href={`/jobs/${job.jobId}`}
                      sx={{
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 13,
                        wordBreak: 'break-all',
                      }}
                    >
                      {job.jobId}
                    </Link>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Chip
                      size="small"
                      label={formatJobKind(job.kind)}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      color={stateColor(job.state)}
                      label={formatJobState(job.state)}
                    />
                  </Stack>
                </TableCell>
                <TableCell>{formatDocumentType(job.documentType)}</TableCell>
                <TableCell align="right">
                  {job.kind === 'generate' && job.requestedCount !== null
                    ? job.requestedCount
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={safePage}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event: ChangeEvent<HTMLInputElement>) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[...JOB_LIST_PAGE_SIZES]}
        labelRowsPerPage="На странице"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} из ${count}`
        }
        getItemAriaLabel={(type) =>
          type === 'next'
            ? 'Следующая страница'
            : type === 'previous'
              ? 'Предыдущая страница'
              : type
        }
        sx={{ display: rows.length === 0 ? 'none' : undefined, flexShrink: 0 }}
      />
    </Stack>
  );
};

JobListLive.displayName = 'JobListLive';
