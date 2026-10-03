import type { FC } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FIELD_HINTS } from '../../i18n/field-hints';
import { FieldHint } from '../field-hint/field-hint';

type Props = {
  open: boolean;
  path: string;
  values: string[];
  action: string;
  cancelHref: string;
  contour: string;
};

export const EnumDomainDialog: FC<Props> = (props) => {
  const { open, path, values, action, cancelHref, contour } = props;
  if (!open) {
    return null;
  }
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="enum-domain-dialog-title"
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
      <Paper elevation={8} sx={{ width: 'min(560px, 100%)', p: 3 }}>
        <Stack spacing={2} component="form" method="post" action={action}>
          <Typography id="enum-domain-dialog-title" variant="h6" component="h2">
            Значения {path}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Добавьте значение в модель генерации без нового обучения.
            Идентификатор версии не меняется.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              maxHeight: 220,
              overflow: 'auto',
            }}
          >
            {values.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Пока нет значений
              </Typography>
            ) : (
              values.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))
            )}
          </Box>
          <input type="hidden" name="contour" value={contour} />
          <input type="hidden" name="path" value={path} />
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}
            >
              <Typography
                variant="body2"
                component="label"
                htmlFor="enum-domain-value"
              >
                Новое значение
              </Typography>
              <FieldHint text={FIELD_HINTS.enumValue} />
            </Box>
            <TextField
              id="enum-domain-value"
              name="value"
              hiddenLabel
              required
              autoFocus
              size="small"
              fullWidth
              placeholder="Например, ERROR"
            />
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button href={cancelHref} size="small">
              Назад
            </Button>
            <Button type="submit" variant="contained" size="small">
              Добавить
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

EnumDomainDialog.displayName = 'EnumDomainDialog';
