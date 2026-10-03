'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import HourglassTop from '@mui/icons-material/HourglassTop';
import { Alert, AlertTitle, Snackbar } from '@mui/material';
import { formHasBlankRequired } from './form-has-blank-required';

export const FormPendingToast: FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onSubmit = (event: Event): void => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      if ((form.method || 'get').toLowerCase() !== 'post') {
        return;
      }
      if (formHasBlankRequired(form)) {
        return;
      }
      setOpen(true);
    };
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="info"
        variant="filled"
        icon={<HourglassTop fontSize="inherit" />}
        sx={{
          minWidth: 320,
          maxWidth: 460,
          alignItems: 'flex-start',
          boxShadow: 8,
          borderRadius: 2,
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>Отправляем</AlertTitle>
        Запрос ушёл. Дождитесь ответа страницы.
      </Alert>
    </Snackbar>
  );
};
