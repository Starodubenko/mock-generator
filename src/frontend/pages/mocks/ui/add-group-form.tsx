'use client';

import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { Alert, Box, Button, TextField } from '@mui/material';
import { formatReason } from '@frontend/shared/i18n/ru-labels';

type Props = {
  contour: string;
  defaultName: string;
  reason: string | null;
};

export const isBlankGroupName = (value: unknown): boolean =>
  !String(value ?? '').trim();

export const AddGroupForm: FC<Props> = (props) => {
  const { contour, defaultName, reason } = props;
  const [empty, setEmpty] = useState(reason === 'validation_error');
  const domainError =
    reason && reason !== 'validation_error' ? formatReason(reason) : '';
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    const data = new FormData(event.currentTarget);
    if (isBlankGroupName(data.get('name'))) {
      event.preventDefault();
      setEmpty(true);
    }
  };
  return (
    <Box
      component="form"
      method="post"
      action="/mocks/groups"
      noValidate
      data-add-group=""
      onSubmit={onSubmit}
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <input type="hidden" name="contour" value={contour} />
      <TextField
        name="name"
        label="Новая группа"
        size="small"
        required
        defaultValue={defaultName}
        error={empty}
        onChange={() => setEmpty(false)}
      />
      <Button type="submit" variant="outlined" size="small">
        Добавить группу
      </Button>
      {domainError ? (
        <Alert severity="error" sx={{ flex: '1 1 100%' }}>
          {domainError}
        </Alert>
      ) : null}
    </Box>
  );
};

AddGroupForm.displayName = 'AddGroupForm';
