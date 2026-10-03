import type { FC } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { formatReason } from '@frontend/shared/i18n/ru-labels';
import { textFieldHintSlots } from '@frontend/shared/ui/field-hint/field-hint';

type Props = {
  open: boolean;
  contour: string;
  cancelHref: string;
  reason: string | null;
};

export const AddDocumentTypeDialog: FC<Props> = (props) => {
  const { open, contour, cancelHref, reason } = props;
  if (!open) {
    return null;
  }
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-document-type-dialog-title"
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
        <Stack
          spacing={2}
          component="form"
          method="post"
          action="/document-types"
        >
          <Typography
            id="add-document-type-dialog-title"
            variant="h6"
            component="h2"
          >
            Новый тип
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Короткий идентификатор: латиница, цифры и дефис, с буквы. Пример:
            document.
          </Typography>
          {reason ? (
            <Alert severity="error">{formatReason(reason)}</Alert>
          ) : null}
          <input type="hidden" name="contour" value={contour} />
          <TextField
            name="documentType"
            label="Идентификатор"
            required
            autoFocus
            size="small"
            placeholder="например document"
            slotProps={{
              inputLabel: { shrink: true },
              ...textFieldHintSlots(FIELD_HINTS.documentTypeId),
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button href={cancelHref} size="small">
              Назад
            </Button>
            <Button type="submit" variant="contained" size="small">
              Добавить тип
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

AddDocumentTypeDialog.displayName = 'AddDocumentTypeDialog';
