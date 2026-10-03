'use client';

import type { FC, MouseEvent } from 'react';
import { useRef } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { parseDraftJsonValues } from '@frontend/shared/lib/parse-json-value';
import { JsonTree } from '@frontend/shared/ui/json-tree/json-tree';

export type DraftRow = {
  id: string;
  status: string;
  messageType: string;
  creationDateTime: string;
  bodyJson: string;
};

type Props = {
  jobId: string;
  contour: string;
  open: boolean;
  canPublish: boolean;
  documents: DraftRow[];
  canSaveResource?: boolean;
};

const setDetailsOpen = (root: HTMLElement | null, next: boolean): void => {
  if (!root) {
    return;
  }
  for (const node of root.querySelectorAll('details')) {
    node.open = next;
  }
};

export const JobDraftDialog: FC<Props> = (props) => {
  const {
    jobId,
    contour,
    open,
    canPublish,
    documents,
    canSaveResource = false,
  } = props;
  const jsonRootRef = useRef<HTMLDivElement>(null);
  const jsonValues = parseDraftJsonValues(
    documents.map((document) => document.bodyJson),
  );
  if (!open) {
    return null;
  }
  const jsonCaption =
    jsonValues.length < documents.length
      ? `Показаны первые ${jsonValues.length} из ${documents.length}`
      : null;
  const expandJson = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDetailsOpen(jsonRootRef.current, true);
  };
  const collapseJson = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDetailsOpen(jsonRootRef.current, false);
  };
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-dialog-title"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 3,
            pt: 2,
            pb: 1,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography id="draft-dialog-title" variant="h6" component="h2">
              Сгенерированная пачка
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {documents.length} документов. На стенд они попадут только после
              «Опубликовать».
            </Typography>
            {jsonCaption ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {jsonCaption}
              </Typography>
            ) : null}
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, pt: 0.5 }}>
            <Button size="small" onClick={expandJson}>
              Развернуть все
            </Button>
            <Button size="small" onClick={collapseJson}>
              Свернуть все
            </Button>
          </Stack>
        </Box>
        <Box
          data-draft-panel="json"
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: 'auto',
            mx: 2,
            mb: 1,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          <Box ref={jsonRootRef}>
            <JsonTree value={jsonValues} defaultOpen />
          </Box>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ p: 1.5, justifyContent: 'flex-end', flexShrink: 0 }}
        >
          <Button href={`/jobs/${jobId}`} size="small">
            Закрыть
          </Button>
          {canSaveResource ? (
            <Button
              href={`/mocks?contour=${encodeURIComponent(contour)}&jobId=${encodeURIComponent(jobId)}`}
              size="small"
            >
              Сохранить в моки
            </Button>
          ) : null}
          {canPublish ? (
            <Button
              href={`/jobs/${jobId}/confirm/publish`}
              variant="contained"
              size="small"
            >
              Опубликовать
            </Button>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
};

JobDraftDialog.displayName = 'JobDraftDialog';
