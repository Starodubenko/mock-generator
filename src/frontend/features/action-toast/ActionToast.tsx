'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlined from '@mui/icons-material/ErrorOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Alert, AlertTitle, Snackbar } from '@mui/material';
import {
  CONSOLE_TOAST_ERROR_MS,
  CONSOLE_TOAST_SUCCESS_MS,
} from './console-toast-timing';

type Severity = 'success' | 'error' | 'info' | 'warning';

type Props = {
  title?: string | null;
  message: string | null;
  severity: Severity;
  stripQueryKey?: string;
  autoHideMs?: number;
};

const icon = (severity: Severity) => {
  if (severity === 'success') {
    return <CheckCircleOutlined fontSize="inherit" />;
  }
  if (severity === 'warning') {
    return <WarningAmberOutlined fontSize="inherit" />;
  }
  if (severity === 'error') {
    return <ErrorOutlined fontSize="inherit" />;
  }
  return <InfoOutlined fontSize="inherit" />;
};

const stripQuery = (key: string): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(key)) {
    return;
  }
  url.searchParams.delete(key);
  window.history.replaceState(
    {},
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

export const ActionToast: FC<Props> = (props) => {
  const { title, message, severity, stripQueryKey, autoHideMs } = props;
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    setOpen(Boolean(message));
    if (message && stripQueryKey) {
      stripQuery(stripQueryKey);
    }
  }, [message, stripQueryKey]);

  if (!message) {
    return null;
  }

  const hideAfter =
    autoHideMs ??
    (severity === 'error' || severity === 'warning'
      ? CONSOLE_TOAST_ERROR_MS || null
      : CONSOLE_TOAST_SUCCESS_MS);

  return (
    <Snackbar
      open={open}
      autoHideDuration={hideAfter}
      onClose={(_, reason) => {
        if (reason === 'clickaway') {
          return;
        }
        setOpen(false);
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={severity}
        variant="filled"
        icon={icon(severity)}
        sx={{
          minWidth: 320,
          maxWidth: 460,
          alignItems: 'flex-start',
          boxShadow: 8,
          borderRadius: 2,
          py: 1.25,
        }}
      >
        {title ? (
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>{title}</AlertTitle>
        ) : null}
        {message}
      </Alert>
    </Snackbar>
  );
};
