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
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';
import { formatReason } from '@frontend/shared/i18n/ru-labels';

type Props = {
  open: boolean;
  groups: string[];
  group: string;
  path: string;
  httpMethod: string;
  summary: string;
  contour: string;
  cancelHref: string;
  reason: string | null;
};

export const AddEndpointDialog: FC<Props> = (props) => {
  const {
    open,
    groups,
    group,
    path,
    httpMethod,
    summary,
    contour,
    cancelHref,
    reason,
  } = props;
  if (!open) {
    return null;
  }
  const selected = groups.includes(group) ? group : (groups[0] ?? '');
  const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(
    httpMethod,
  )
    ? httpMethod
    : 'GET';
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-endpoint-title"
      data-add-endpoint=""
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        p: 2,
      }}
    >
      <Paper elevation={8} sx={{ width: 'min(520px, 100%)', p: 3 }}>
        <Stack
          component="form"
          method="post"
          action="/mocks/endpoints"
          spacing={2.5}
        >
          <input type="hidden" name="contour" value={contour} />
          <Typography id="add-endpoint-title" variant="h6" component="h2">
            Новый эндпоинт
          </Typography>
          {reason ? (
            <Alert severity="error">{formatReason(reason)}</Alert>
          ) : null}
          {groups.length === 0 ? (
            <Alert severity="info">
              Сначала добавьте группу на вкладке — её можно выбрать здесь.
            </Alert>
          ) : (
            <Box>
              <Typography
                variant="body2"
                component="label"
                htmlFor="mock-group"
                sx={{ display: 'block', mb: 1 }}
              >
                Группа
              </Typography>
              <KitSelect
                id="mock-group"
                name="group"
                aria-label="Группа"
                defaultValue={selected}
                options={groups.map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </Box>
          )}
          <Box>
            <Typography
              variant="body2"
              component="label"
              htmlFor="mock-http-method"
              sx={{ display: 'block', mb: 1 }}
            >
              Метод
            </Typography>
            <KitSelect
              id="mock-http-method"
              name="httpMethod"
              aria-label="Метод"
              defaultValue={method}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'HEAD', label: 'HEAD' },
              ]}
            />
          </Box>
          <TextField
            name="path"
            label="Путь"
            size="small"
            fullWidth
            defaultValue={path || '/api/tasks'}
          />
          <TextField
            name="summary"
            label="Описание"
            size="small"
            fullWidth
            defaultValue={summary}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end', pt: 0.5 }}
          >
            <Button href={cancelHref} size="small">
              Назад
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={groups.length === 0}
            >
              Добавить
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

AddEndpointDialog.displayName = 'AddEndpointDialog';
