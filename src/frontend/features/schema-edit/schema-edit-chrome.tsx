import type { FC } from 'react';
import {
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { FieldHint } from '@frontend/shared/ui/field-hint/field-hint';
import { FieldLabel } from '@frontend/shared/ui/field-hint/field-label';
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';
import { PATH_CLASS_OPTIONS } from '@frontend/shared/ui/schema-tree/path-class-options';
import { SCHEMA_EDIT_RUNTIME } from './schema-edit-runtime';

export const SchemaEditButtons: FC = () => (
  <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
    <Button
      data-schema-edit-start=""
      type="button"
      variant="outlined"
      size="small"
    >
      Редактировать
    </Button>
    <Button
      data-schema-add-field=""
      type="button"
      variant="outlined"
      size="small"
      sx={{ display: 'none' }}
    >
      Добавить поле
    </Button>
    <Button
      data-link-add=""
      type="button"
      variant="outlined"
      size="small"
      sx={{ display: 'none' }}
    >
      Добавить связь
    </Button>
    <Button
      data-schema-edit-save=""
      type="button"
      variant="contained"
      size="small"
      sx={{ display: 'none' }}
    >
      Сохранить
    </Button>
    <Button
      data-schema-edit-cancel=""
      type="button"
      size="small"
      sx={{ display: 'none' }}
    >
      Отменить
    </Button>
  </Stack>
);

const dialogSx = {
  display: 'none',
  position: 'fixed' as const,
  inset: 0,
  zIndex: 1600,
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'rgba(0, 0, 0, 0.5)',
  p: 2,
};

export const SchemaEditDialogs: FC = () => (
  <>
    <Box
      data-schema-save-dialog=""
      data-open="false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-save-title"
      sx={dialogSx}
    >
      <Paper elevation={8} sx={{ width: 'min(560px, 100%)', p: 3 }}>
        <Stack spacing={2}>
          <Typography id="schema-save-title" variant="h6" component="h2">
            Сохранить новую версию схемы?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Версия иммутабельна: текущий снимок не переписывается. Изменения
            сохранятся как новая версия с новым идентификатором. Рабочая версия
            контура не сменится, пока вы явно не включите активацию.
          </Typography>
          <Stack
            data-schema-activate-row=""
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center' }}
          >
            <Box
              component="button"
              type="button"
              role="switch"
              aria-checked="false"
              aria-label="Сделать активной новую версию"
              data-schema-activate-toggle=""
              sx={{
                width: 44,
                height: 24,
                p: 0,
                border: 0,
                borderRadius: 12,
                bgcolor: 'action.disabledBackground',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                '&[aria-checked="true"]': { bgcolor: 'primary.main' },
                '&[aria-checked="true"] [data-schema-activate-thumb]': {
                  transform: 'translateX(20px)',
                },
              }}
            >
              <Box
                data-schema-activate-thumb=""
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'common.white',
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  boxShadow: 1,
                  transition: 'transform 150ms ease',
                }}
              />
            </Box>
            <Typography variant="body2">
              Сделать активной новую версию
            </Typography>
          </Stack>
          <input
            type="hidden"
            name="activate"
            value="0"
            data-schema-activate-value=""
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button data-schema-save-back="" type="button" size="small">
              Назад
            </Button>
            <Button type="submit" variant="contained" size="small">
              Сохранить новую версию
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
    <Box
      data-schema-cancel-dialog=""
      data-open="false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-cancel-title"
      sx={dialogSx}
    >
      <Paper elevation={8} sx={{ width: 'min(520px, 100%)', p: 3 }}>
        <Stack spacing={2}>
          <Typography id="schema-cancel-title" variant="h6" component="h2">
            Отменить изменения?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Несохранённые изменения схемы будут потеряны. Исходная версия
            останется без изменений.
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button data-schema-cancel-back="" type="button" size="small">
              Назад
            </Button>
            <Button
              data-schema-cancel-confirm=""
              type="button"
              color="error"
              variant="contained"
              size="small"
            >
              Отменить изменения
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
    <Box
      data-schema-add-dialog=""
      data-open="false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-add-title"
      sx={dialogSx}
    >
      <Paper elevation={8} sx={{ width: 'min(560px, 100%)', p: 3 }}>
        <Stack spacing={2}>
          <Typography id="schema-add-title" variant="h6" component="h2">
            Добавить поле
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Поле попадёт в новую версию схемы. Текущий снимок не переписывается.
          </Typography>
          <Box>
            <FieldLabel
              htmlFor="schema-add-field-name"
              hint={FIELD_HINTS.schemaFieldName}
            >
              Имя поля
            </FieldLabel>
            <TextField
              id="schema-add-field-name"
              hiddenLabel
              size="small"
              fullWidth
              placeholder="Например, note или meta.flag"
              slotProps={{
                htmlInput: { 'data-schema-add-name': '', autoComplete: 'off' },
              }}
            />
          </Box>
          <Box>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', mb: 0.75 }}
            >
              <Typography
                variant="body2"
                component="label"
                htmlFor="schema-add-field-type"
              >
                Тип поля
              </Typography>
              <FieldHint text={FIELD_HINTS.schemaFieldType} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box data-schema-add-type="" sx={{ width: 160, minWidth: 160 }}>
                <KitSelect
                  id="schema-add-field-type"
                  name="pathClass:__add__"
                  defaultValue="free-text"
                  fullWidth
                  maxWidth="160px"
                  aria-label="Тип поля"
                  options={[...PATH_CLASS_OPTIONS]}
                />
              </Box>
              <Link
                data-schema-enum-edit=""
                data-path="__add__"
                href="#schema-enum"
                variant="caption"
                underline="hover"
                sx={{ display: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Изменить
              </Link>
              <input
                type="hidden"
                name="enumAdded:__add__"
                defaultValue=""
                data-enum-added="__add__"
              />
            </Stack>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button data-schema-add-back="" type="button" size="small">
              Назад
            </Button>
            <Button
              data-schema-add-confirm=""
              type="button"
              variant="contained"
              size="small"
            >
              Добавить
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
    <Box
      data-schema-enum-dialog=""
      data-open="false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-enum-title"
      sx={dialogSx}
    >
      <Paper elevation={8} sx={{ width: 'min(560px, 100%)', p: 3 }}>
        <Stack spacing={2}>
          <Typography id="schema-enum-title" variant="h6" component="h2">
            Значения <Box component="span" data-schema-enum-path="" />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Новые значения попадут в сохраняемую версию. Текущий снимок не
            переписывается.
          </Typography>
          <Box
            data-schema-enum-chips=""
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              maxHeight: 220,
              overflow: 'auto',
              '& [data-enum-chip]': {
                px: 1,
                py: 0.25,
                borderRadius: 2,
                bgcolor: 'action.hover',
                fontSize: 13,
              },
            }}
          />
          <Box>
            <Typography
              variant="body2"
              component="label"
              htmlFor="schema-enum-value"
              sx={{ display: 'block', mb: 0.75 }}
            >
              Новое значение
            </Typography>
            <TextField
              id="schema-enum-value"
              hiddenLabel
              size="small"
              fullWidth
              placeholder="Например, ERROR"
              slotProps={{
                htmlInput: {
                  'data-schema-enum-field': '',
                  autoComplete: 'off',
                },
              }}
            />
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button data-schema-enum-back="" type="button" size="small">
              Назад
            </Button>
            <Button
              data-schema-enum-add=""
              type="button"
              variant="contained"
              size="small"
            >
              Добавить
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
    <script dangerouslySetInnerHTML={{ __html: SCHEMA_EDIT_RUNTIME }} />
  </>
);

SchemaEditButtons.displayName = 'SchemaEditButtons';
SchemaEditDialogs.displayName = 'SchemaEditDialogs';
