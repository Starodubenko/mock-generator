import type { FC } from 'react';
import CloudUpload from '@mui/icons-material/CloudUpload';
import { Box, Stack, Typography } from '@mui/material';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { FieldHint } from '@frontend/shared/ui/field-hint/field-hint';
import { CORPUS_ACCEPT } from './corpus-files';
import { CORPUS_DROPZONE_RUNTIME } from './corpus-dropzone-runtime';

export const CorpusDropzone: FC = () => (
  <Box
    sx={{
      '&:has(input[name="corpus"]:valid) [data-corpus-dropzone]': {
        display: 'none',
      },
      '&:has(input[name="corpus"][data-filled="true"]) [data-corpus-dropzone]':
        { display: 'none' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
      <Typography variant="subtitle2">Эталонные файлы</Typography>
      <FieldHint text={FIELD_HINTS.corpus} />
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
      JSON-массив, один объект или NDJSON. Сервис никуда за корпусом не ходит —
      только эти файлы.
    </Typography>
    <Box
      data-corpus-dropzone=""
      sx={{
        position: 'relative',
        border: '2px dashed',
        borderColor: 'grey.400',
        bgcolor: 'rgba(25, 118, 210, 0.04)',
        borderRadius: 3,
        px: 3,
        py: 5,
        minHeight: 196,
        overflow: 'hidden',
        '&[data-drag="true"]': {
          borderColor: 'primary.main',
          bgcolor: 'rgba(25, 118, 210, 0.1)',
          boxShadow: 2,
        },
      }}
    >
      <Stack
        spacing={1.25}
        sx={{
          alignItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            color: 'primary.main',
            boxShadow: 1,
          }}
        >
          <CloudUpload sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Перетащите эталон сюда
        </Typography>
        <Typography variant="body2" color="text.secondary">
          или нажмите, чтобы выбрать .json, .ndjson или .jsonl
        </Typography>
      </Stack>
      <Box
        component="input"
        id="corpus-input"
        type="file"
        name="corpus"
        multiple
        required
        accept={CORPUS_ACCEPT}
        aria-label="Эталонные файлы"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          fontSize: 0,
        }}
      />
    </Box>
    <Stack
      data-corpus-file-list=""
      spacing={1}
      sx={{
        '&:empty': { display: 'none' },
        '& [data-corpus-file-row]': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
        '& [data-corpus-file-meta]': {
          display: 'flex',
          alignItems: 'baseline',
          minWidth: 0,
          flex: 1,
          gap: 1,
        },
        '& [data-corpus-file-name]': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 14,
        },
        '& [data-corpus-file-size]': {
          flexShrink: 0,
          color: 'text.secondary',
          fontSize: 12,
        },
        '& [data-corpus-remove]': {
          appearance: 'none',
          flexShrink: 0,
          m: 0,
          px: 1.25,
          py: 0.5,
          border: 0,
          borderRadius: 1,
          bgcolor: 'rgba(211, 47, 47, 0.08)',
          color: 'error.main',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
          cursor: 'pointer',
        },
        '& [data-corpus-remove]:hover': {
          bgcolor: 'rgba(211, 47, 47, 0.16)',
        },
      }}
    />
    <script dangerouslySetInnerHTML={{ __html: CORPUS_DROPZONE_RUNTIME }} />
  </Box>
);
