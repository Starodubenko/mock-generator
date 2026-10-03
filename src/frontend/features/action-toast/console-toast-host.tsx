import type { FC } from 'react';
import Close from '@mui/icons-material/Close';
import { Box, IconButton, Typography } from '@mui/material';
import {
  formatToastCopy,
  toastSeverity,
} from '@frontend/shared/i18n/toast-labels';
import { CONSOLE_TOAST_RUNTIME } from './console-toast-runtime';

type Props = {
  toast: string | null;
  sharePath?: string | null;
};

const toneColor = (
  severity: 'success' | 'error' | 'info' | 'warning',
): string => {
  if (severity === 'success') {
    return '#2e7d32';
  }
  if (severity === 'error') {
    return '#d32f2f';
  }
  if (severity === 'warning') {
    return '#ed6c02';
  }
  return '#0288d1';
};

export const ConsoleToastHost: FC<Props> = (props) => {
  const { toast, sharePath = null } = props;
  const copy = toast ? formatToastCopy(toast) : null;
  const body =
    copy && sharePath && toast === 'mock_resource_saved'
      ? `${copy.body} ${sharePath}`
      : copy?.body;
  const severity = toast ? toastSeverity(toast) : 'info';
  return (
    <Box data-console-toast-host="" data-initial-open={copy ? 'true' : 'false'}>
      <Box
        data-console-toast=""
        data-open={copy ? 'true' : 'false'}
        data-severity={severity}
        role="status"
        sx={{
          display: copy ? 'block' : 'none',
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 2000,
          width: 'min(460px, calc(100vw - 32px))',
          bgcolor: toneColor(severity),
          color: 'common.white',
          borderRadius: 2,
          boxShadow: 8,
          p: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              data-console-toast-title=""
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                display: copy?.title ? 'block' : 'none',
              }}
            >
              {copy?.title ?? ''}
            </Typography>
            <Typography data-console-toast-body="" variant="body2">
              {body ?? ''}
            </Typography>
          </Box>
          <IconButton
            data-console-toast-close=""
            type="button"
            size="small"
            aria-label="Закрыть уведомление"
            sx={{ color: 'common.white', mt: -0.5 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <script dangerouslySetInnerHTML={{ __html: CONSOLE_TOAST_RUNTIME }} />
    </Box>
  );
};

ConsoleToastHost.displayName = 'ConsoleToastHost';
