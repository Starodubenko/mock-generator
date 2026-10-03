'use client';

import type { FC, FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { FieldLabel } from '@frontend/shared/ui/field-hint/field-label';
import {
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
  isConsoleLiveKind,
  isConsoleLiveState,
  isTerminalConsoleLiveState,
} from '@frontend/entities/console-live/console-live.contract';
import { applyJobLiveEvent } from '@frontend/entities/job/apply-job-live-event';
import { JobStatusSegment } from '../job-status-poll/JobStatusSegment';
import {
  formatDocumentType,
  formatJobKind,
  formatJobState,
  formatReason,
} from '@frontend/shared/i18n/ru-labels';
import { ReasonToast } from '../action-toast/ReasonToast';
import { ConfirmDialog } from '@frontend/shared/ui/confirm-dialog/confirm-dialog';
import { subscribeConsoleLive } from '../console-live/connection/console-live.bus';
import { trainAliasHrefFromLive } from '../versions-pending/train-alias-href';

type JobProps = {
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

type Props = {
  job: JobProps;
  confirm?: 'cancel' | 'publish' | null;
  draftCount?: number;
  aliasHref?: string | null;
  draftDialog?: (canPublish: boolean) => ReactNode;
};

export const JobLivePanel: FC<Props> = (props) => {
  const {
    job,
    confirm = null,
    draftCount = 0,
    aliasHref = null,
    draftDialog,
  } = props;
  const [live, setLive] = useState({
    jobId: job.jobId,
    kind: job.kind,
    state: job.state,
    reason: job.reason,
    contour: job.contour,
    profileVersionId: job.profileVersionId,
    publishedCount: job.publishedCount,
    quarantineCount: job.quarantineCount,
    requestedCount: job.requestedCount,
    draftCount,
  });

  useEffect(() => {
    setLive({
      jobId: job.jobId,
      kind: job.kind,
      state: job.state,
      reason: job.reason,
      contour: job.contour,
      profileVersionId: job.profileVersionId,
      publishedCount: job.publishedCount,
      quarantineCount: job.quarantineCount,
      requestedCount: job.requestedCount,
      draftCount,
    });
  }, [
    job.jobId,
    job.kind,
    job.state,
    job.reason,
    job.contour,
    job.profileVersionId,
    job.publishedCount,
    job.quarantineCount,
    job.requestedCount,
    draftCount,
  ]);

  useEffect(() => {
    return subscribeConsoleLive((event) => {
      setLive((current) => applyJobLiveEvent(current, event));
    });
  }, []);

  const [indexEmpty, setIndexEmpty] = useState(
    confirm === 'publish' && job.reason === 'validation_error',
  );
  const terminal = isTerminalConsoleLiveState(live.state);
  const onPublishSubmit = (event: FormEvent<HTMLFormElement>): void => {
    const data = new FormData(event.currentTarget);
    if (!String(data.get('targetIndex') ?? '').trim()) {
      event.preventDefault();
      setIndexEmpty(true);
    }
  };
  const versionId = live.profileVersionId;
  const versionHref = versionId
    ? `/profiles/${job.documentType}/versions/${versionId}?contour=${encodeURIComponent(live.contour)}`
    : null;

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
      >
        <Typography variant="h5" component="h1">
          Задание
        </Typography>
        <Chip size="small" label={formatJobKind(live.kind)} />
        <Chip
          size="small"
          label={formatDocumentType(job.documentType)}
          variant="outlined"
        />
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ wordBreak: 'break-all' }}
      >
        {job.jobId}
      </Typography>
      <JobStatusSegment
        jobId={job.jobId}
        state={live.state}
        reason={live.reason}
        succeededHref={
          job.profileVersionLabel
            ? null
            : trainAliasHrefFromLive({
                kind: live.kind,
                state: live.state,
                contour: live.contour,
                documentType: job.documentType,
                profileVersionId: live.profileVersionId,
                jobId: job.jobId,
                fallbackHref: aliasHref,
              })
        }
      />
      {versionHref ? (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'baseline' }}
          data-job-version=""
        >
          <Typography variant="body2" color="text.secondary">
            Версия:
          </Typography>
          <Button
            href={versionHref}
            variant="text"
            size="small"
            sx={{
              minWidth: 0,
              p: 0,
              lineHeight: 1.43,
              textTransform: 'none',
              textDecoration: 'underline',
            }}
          >
            {versionId}
          </Button>
        </Stack>
      ) : null}
      {isConsoleLiveKind(live.kind, ConsoleLiveJobKind.Train) ? (
        <Alert
          severity="success"
          sx={{
            display: isConsoleLiveState(
              live.state,
              ConsoleLiveJobState.Succeeded,
            )
              ? undefined
              : 'none',
          }}
        >
          Обучение завершено. Документы в индекс не публикуются — это нормально.
          Откройте версию и активируйте её отдельно, затем запускайте генерацию.
        </Alert>
      ) : null}
      {isConsoleLiveKind(live.kind, ConsoleLiveJobKind.Train) ? (
        <Alert
          severity="info"
          sx={{
            display:
              !isConsoleLiveState(live.state, ConsoleLiveJobState.Succeeded) &&
              !live.reason
                ? undefined
                : 'none',
          }}
        >
          Обучение только строит профиль. Счётчик «опубликовано» останется
          нулевым.
        </Alert>
      ) : null}
      <Alert
        severity="error"
        sx={{
          display:
            live.reason &&
            !(confirm === 'publish' && live.reason === 'validation_error')
              ? undefined
              : 'none',
        }}
      >
        {live.reason ? `Причина: ${formatReason(live.reason)}` : ''}
      </Alert>
      <ReasonToast
        reason={
          confirm === 'publish' && live.reason === 'validation_error'
            ? null
            : live.reason
        }
      />
      {isConsoleLiveKind(live.kind, ConsoleLiveJobKind.Generate) ? (
        <>
          <Alert
            severity="info"
            sx={{
              display:
                isConsoleLiveState(live.state, ConsoleLiveJobState.Accepted) &&
                live.draftCount === 0 &&
                !live.reason
                  ? undefined
                  : 'none',
            }}
          >
            Собираем черновик. Кнопка просмотра появится, когда пачка будет
            готова.
          </Alert>
          <Alert
            severity="info"
            sx={{
              display: isConsoleLiveState(
                live.state,
                ConsoleLiveJobState.Preview,
              )
                ? undefined
                : 'none',
            }}
          >
            Черновик готов. Откройте данные, проверьте пачку и опубликуйте её на
            стенд.
          </Alert>
          {job.fieldConstraints && job.fieldConstraints.length > 0 ? (
            <Typography>
              Ограничения пачки:{' '}
              {job.fieldConstraints
                .map((item) => `${item.path}=${item.values.join(',')}`)
                .join('; ')}
            </Typography>
          ) : null}
          <Typography>Запрошено: {live.requestedCount ?? '—'}</Typography>
          <Typography>В черновике: {live.draftCount}</Typography>
          <Typography>Опубликовано: {live.publishedCount}</Typography>
          <Typography>В карантине: {live.quarantineCount}</Typography>
        </>
      ) : null}
      <Box
        data-job-actions=""
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {isConsoleLiveKind(live.kind, ConsoleLiveJobKind.Generate) ? (
          <>
            <Button
              href={`/jobs/${job.jobId}/data`}
              variant="contained"
              size="small"
              sx={{ display: live.draftCount > 0 ? undefined : 'none' }}
            >
              Посмотреть данные
            </Button>
            <Button
              href={`/jobs/${job.jobId}/quarantine`}
              variant="text"
              size="small"
            >
              Карантин
            </Button>
          </>
        ) : (
          <Button
            href={`/profiles/${job.documentType}?contour=${encodeURIComponent(live.contour)}`}
            variant="outlined"
            size="small"
          >
            К обучению
          </Button>
        )}
        <Button
          href={`/jobs/${job.jobId}/confirm/cancel`}
          color="error"
          size="small"
          sx={{ display: terminal ? 'none' : undefined }}
        >
          Отменить задание
        </Button>
      </Box>
      {isConsoleLiveKind(live.kind, ConsoleLiveJobKind.Generate) && draftDialog
        ? draftDialog(
            isConsoleLiveState(live.state, ConsoleLiveJobState.Preview),
          )
        : null}
      <Typography
        variant="body2"
        sx={{ display: terminal ? undefined : 'none' }}
      >
        Состояние: {formatJobState(live.state)} (финальное)
      </Typography>
      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Отменить задание?"
        description="Задание остановится. Документы, которые уже ушли на стенд, останутся. Это действие нельзя отменить."
        actionLabel="Отменить задание"
        action={`/jobs/${job.jobId}/cancel`}
        cancelHref={`/jobs/${job.jobId}`}
        danger
      />
      <ConfirmDialog
        open={confirm === 'publish'}
        title="Опубликовать пачку на стенд?"
        description="Сначала уйдёт пробная пачка и золотые запросы, затем полная заливка. Сомнительные документы соседний микросервис не примет."
        actionLabel="Опубликовать"
        action={`/jobs/${job.jobId}/publish`}
        cancelHref={`/jobs/${job.jobId}/data`}
        noValidate
        onSubmit={onPublishSubmit}
      >
        <FieldLabel
          htmlFor="publish-target-index"
          hint={FIELD_HINTS.targetIndex}
        >
          Целевой индекс
        </FieldLabel>
        <TextField
          id="publish-target-index"
          name="targetIndex"
          size="small"
          fullWidth
          required
          defaultValue={job.targetIndex || 'documents-synthetic'}
          error={indexEmpty}
          onChange={() => setIndexEmpty(false)}
        />
      </ConfirmDialog>
    </Stack>
  );
};
