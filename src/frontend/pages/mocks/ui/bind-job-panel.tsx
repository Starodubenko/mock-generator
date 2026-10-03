import type { FC } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';

export type BindEndpoint = {
  method: string;
  path: string;
  group: string;
  summary: string;
  hasBody: boolean;
};

type Props = {
  open: boolean;
  jobId: string;
  draftCount: number;
  contour: string;
  groups: string[];
  bindGroup: string;
  endpoints: BindEndpoint[];
};

export const BindJobPanel: FC<Props> = (props) => {
  const {
    open,
    jobId,
    draftCount,
    contour,
    groups,
    bindGroup,
    endpoints,
  } = props;
  if (!open) {
    return null;
  }
  const selectedGroup = groups.includes(bindGroup)
    ? bindGroup
    : (groups[0] ?? '');
  const inGroup = endpoints.filter((item) => item.group === selectedGroup);
  const first = inGroup[0];
  const defaultEndpoint = first ? `${first.method} ${first.path}` : '';
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="bind-job-title"
      data-bind-job=""
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
        <Stack spacing={2.5}>
          <Typography id="bind-job-title" variant="h6" component="h2">
            Сохранить черновик
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {draftCount} документов. Выберите группу и эндпоинт — JSON уйдёт в
            его ответ.
          </Typography>
          {groups.length === 0 ? (
            <Stack spacing={2.5}>
              <Alert severity="info">
                Сначала добавьте группу и эндпоинт в каталоге.
              </Alert>
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'flex-end' }}
              >
                <Button href={`/mocks?contour=${contour}`} size="small">
                  К каталогу
                </Button>
                <Button href={`/jobs/${jobId}/data`} size="small">
                  К заданию
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Box
                component="form"
                method="get"
                action="/mocks"
                data-bind-group-form=""
              >
                <input type="hidden" name="contour" value={contour} />
                <input type="hidden" name="jobId" value={jobId} />
                <Typography
                  variant="body2"
                  component="label"
                  htmlFor="bind-group"
                  sx={{ display: 'block', mb: 1 }}
                >
                  Группа
                </Typography>
                <KitSelect
                  id="bind-group"
                  name="bindGroup"
                  aria-label="Группа"
                  defaultValue={selectedGroup}
                  submitOnChange
                  options={groups.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </Box>
              <Box
                component="form"
                method="get"
                action="/mocks"
                data-bind-endpoint-form=""
              >
                <input type="hidden" name="contour" value={contour} />
                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="bindGroup" value={selectedGroup} />
                <input type="hidden" name="confirmBind" value="1" />
                {inGroup.length === 0 ? (
                  <Alert severity="info">
                    В этой группе ещё нет эндпоинтов.
                  </Alert>
                ) : (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="body2"
                      component="label"
                      htmlFor="bind-endpoint"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      Эндпоинт
                    </Typography>
                    <KitSelect
                      id="bind-endpoint"
                      name="endpoint"
                      aria-label="Эндпоинт"
                      defaultValue={defaultEndpoint}
                      options={inGroup.map((item) => ({
                        value: `${item.method} ${item.path}`,
                        label: `${item.method} ${item.path}`,
                      }))}
                    />
                  </Box>
                )}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: 'flex-end' }}
                >
                  <Button href={`/mocks?contour=${contour}`} size="small">
                    Отмена
                  </Button>
                  <Button href={`/jobs/${jobId}/data`} size="small">
                    К заданию
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    disabled={inGroup.length === 0}
                  >
                    Сохранить
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

BindJobPanel.displayName = 'BindJobPanel';
