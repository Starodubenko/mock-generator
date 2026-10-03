import type { FC } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ACTIVE_VERSION_WATCH_RUNTIME } from './active-version-watch-runtime';
import {
  toSafeJson,
  type ActiveVersionSnapshot,
} from './compare-active-versions';

type Props = {
  snapshot: ActiveVersionSnapshot;
};

export const ActiveVersionWatch: FC<Props> = (props) => {
  const { snapshot } = props;
  const snapshotKey = `${snapshot.contour}:${snapshot.items
    .map((item) => `${item.documentType}:${item.versionId ?? ''}`)
    .join(',')}`;
  return (
    <Box data-active-version-watch="" data-snapshot-key={snapshotKey}>
      <script
        type="application/json"
        data-active-version-snapshot=""
        dangerouslySetInnerHTML={{ __html: toSafeJson(snapshot) }}
      />
      <Box
        data-active-version-dialog=""
        data-open="false"
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-version-watch-title"
        sx={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          zIndex: 1800,
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          p: 2,
        }}
      >
        <Paper elevation={8} sx={{ width: 'min(720px, 100%)', p: 3 }}>
          <Stack spacing={2}>
            <Typography
              id="active-version-watch-title"
              variant="h6"
              component="h2"
            >
              Изменились активные версии
            </Typography>
            <Typography variant="body2" color="text.secondary">
              С прошлого открытия пульта сменилась рабочая версия у одного или
              нескольких типов документов.
            </Typography>
            <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Тип документа</TableCell>
                    <TableCell>Было</TableCell>
                    <TableCell>Стало</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody data-active-version-rows="" />
              </Table>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                data-active-version-dismiss=""
                type="button"
                variant="contained"
                size="small"
              >
                Понятно
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <script
        dangerouslySetInnerHTML={{ __html: ACTIVE_VERSION_WATCH_RUNTIME }}
      />
    </Box>
  );
};

ActiveVersionWatch.displayName = 'ActiveVersionWatch';
