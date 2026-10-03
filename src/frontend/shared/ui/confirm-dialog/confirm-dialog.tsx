import type { FC, FormEvent, ReactNode } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';

export type ConfirmField = {
  name: string;
  value: string;
};

type Props = {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  action: string;
  cancelHref: string;
  hiddenFields?: ConfirmField[];
  danger?: boolean;
  method?: 'get' | 'post';
  children?: ReactNode;
  noValidate?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export const ConfirmDialog: FC<Props> = (props) => {
  const {
    open,
    title,
    description,
    actionLabel,
    action,
    cancelHref,
    hiddenFields = [],
    danger = false,
    method = 'post',
    children,
    noValidate = false,
    onSubmit,
  } = props;
  if (!open) {
    return null;
  }
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        p: 2,
      }}
    >
      <Paper elevation={8} sx={{ width: 'min(520px, 100%)', p: 3 }}>
        <Stack spacing={2}>
          <Typography id="confirm-dialog-title" variant="h6" component="h2">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Box
            component="form"
            method={method}
            action={action}
            noValidate={noValidate}
            onSubmit={onSubmit}
          >
            {children}
            {hiddenFields.map((field, index) => (
              <input
                key={`${field.name}:${index}`}
                type="hidden"
                name={field.name}
                value={field.value}
              />
            ))}
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'flex-end', mt: children ? 2 : 0 }}
            >
              <Button href={cancelHref} size="small">
                Назад
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="small"
                color={danger ? 'error' : 'primary'}
              >
                {actionLabel}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';
