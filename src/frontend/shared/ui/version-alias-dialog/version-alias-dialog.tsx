import type { FC } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FIELD_HINTS } from '../../i18n/field-hints';
import { textFieldHintSlots } from '../field-hint/field-hint';

type Props = {
  open: boolean;
  versionId: string;
  action: string;
  cancelHref: string;
  contour: string;
};

export const VersionAliasDialog: FC<Props> = (props) => {
  const { open, versionId, action, cancelHref, contour } = props;
  if (!open) {
    return null;
  }
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-alias-dialog-title"
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
        <Stack spacing={2} component="form" method="post" action={action}>
          <Typography
            id="version-alias-dialog-title"
            variant="h6"
            component="h2"
          >
            Имя версии {versionId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Короткий алиас для списков и селектов. Идентификатор версии не
            меняется.
          </Typography>
          <input type="hidden" name="contour" value={contour} />
          <TextField
            name="label"
            label="Алиас"
            required
            autoFocus
            size="small"
            placeholder="например стенд сентябрь"
            slotProps={{
              htmlInput: { maxLength: 80 },
              inputLabel: { shrink: true },
              ...textFieldHintSlots(FIELD_HINTS.versionAlias),
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button href={cancelHref} size="small">
              Пропустить
            </Button>
            <Button type="submit" variant="contained" size="small">
              Сохранить
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

VersionAliasDialog.displayName = 'VersionAliasDialog';
