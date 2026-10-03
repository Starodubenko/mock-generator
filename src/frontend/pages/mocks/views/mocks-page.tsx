import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { ReasonToast } from '@frontend/features/action-toast/ReasonToast';
import { ConfirmDialog } from '@frontend/shared/ui/confirm-dialog/confirm-dialog';
import { mocksHelp } from '../config/help';
import { AddGroupForm } from '../ui/add-group-form';
import { AddEndpointDialog } from '../ui/add-endpoint-dialog';
import { BindJobPanel, type BindEndpoint } from '../ui/bind-job-panel';
import { SwaggerOperation } from '../ui/swagger-operation';

export type MockEndpointRow = BindEndpoint & {
  jobId: string;
  updatedAt: string;
};

type Props = PageProps<{
  contour: string;
  reason: string | null;
  groups: string[];
  endpoints: MockEndpointRow[];
  shareOrigin: string;
  publicOrigin: string;
  addGroup: string;
  addPath: string;
  addHttpMethod: string;
  addSummary: string;
  addEndpoint: boolean;
  jobId: string | null;
  draftCount: number;
  confirmDeleteGroup: string | null;
  confirmDeleteMethod: string | null;
  confirmDeletePath: string | null;
  confirmBind: boolean;
  bindGroup: string;
  bindTargets: string[];
}>;

const byGroup = (
  endpoints: MockEndpointRow[],
  groups: string[],
): Array<{ name: string; items: MockEndpointRow[] }> => {
  const names = [
    ...new Set([...groups, ...endpoints.map((item) => item.group)]),
  ].sort((left, right) => left.localeCompare(right));
  return names.map((name) => ({
    name,
    items: endpoints.filter((item) => item.group === name),
  }));
};

const mocksListHref = (
  contour: string,
  extras: Record<string, string> = {},
): string => {
  const params = new URLSearchParams({ contour, ...extras });
  return `/mocks?${params.toString()}`;
};

export const MocksPage: FC<Props> = (props) => {
  const {
    contour,
    reason,
    groups,
    endpoints,
    shareOrigin,
    publicOrigin,
    addGroup,
    addPath,
    addHttpMethod,
    addSummary,
    addEndpoint,
    jobId,
    draftCount,
    confirmDeleteGroup,
    confirmDeleteMethod,
    confirmDeletePath,
    confirmBind,
    bindGroup,
    bindTargets,
  } = props;
  const origin = shareOrigin.replace(/\/$/, '');
  const consoleOrigin = publicOrigin.replace(/\/$/, '');
  const sections = byGroup(endpoints, groups);
  const withJob = (
    extras: Record<string, string> = {},
  ): Record<string, string> => (jobId ? { jobId, ...extras } : extras);
  const listHref = mocksListHref(contour, withJob());
  const addHref = `/mocks/new?${new URLSearchParams(
    withJob({ contour }),
  ).toString()}`;
  const deleteEndpoint =
    confirmDeleteMethod && confirmDeletePath
      ? `${confirmDeleteMethod} ${confirmDeletePath}`
      : '';
  return (
    <>
      <PageWithHelp markdown={mocksHelp(contour)}>
        <PagePanel lockScroll>
          <Stack spacing={2} sx={{ minHeight: 0, height: 1 }}>
            <ReasonToast
              reason={
                addEndpoint || reason === 'validation_error' ? null : reason
              }
            />
            <Paper
              data-swagger-shell=""
              sx={{
                bgcolor: '#1b1b1b',
                color: '#fff',
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#89bf04',
                }}
              />
              <Typography variant="h6" sx={{ flex: 1 }}>
                Моки
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                OpenAPI-каталог стенда
              </Typography>
            </Paper>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <AddGroupForm
                contour={contour}
                defaultName={addGroup}
                reason={addEndpoint ? null : reason}
              />
              <Button href={addHref} variant="contained" size="small">
                Добавить эндпоинт
              </Button>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Stack spacing={2}>
                {sections.length === 0 ? (
                  <Typography color="text.secondary">
                    Пока нет групп. Добавьте тег и операции — как в Swagger.
                  </Typography>
                ) : (
                  sections.map((section) => (
                    <Box key={section.name} data-swagger-tag={section.name}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'center',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          pb: 0.5,
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1">
                          {section.name}
                        </Typography>
                        <Button
                          href={mocksListHref(
                            contour,
                            withJob({ confirmDeleteGroup: section.name }),
                          )}
                          size="small"
                          color="error"
                        >
                          Удалить группу
                        </Button>
                      </Stack>
                      <Stack spacing={1}>
                        {section.items.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            В группе ещё нет эндпоинтов.
                          </Typography>
                        ) : (
                          section.items.map((item) => (
                            <SwaggerOperation
                              key={`${item.method} ${item.path}`}
                              item={{
                                ...item,
                                shareUrl: `${origin}${item.path}`,
                                publicUrl: `${consoleOrigin}${item.path}`,
                              }}
                              confirmHref={mocksListHref(
                                contour,
                                withJob({
                                  confirmDeleteMethod: item.method,
                                  confirmDeletePath: item.path,
                                }),
                              )}
                              open={false}
                            />
                          ))
                        )}
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          </Stack>
        </PagePanel>
      </PageWithHelp>
      <BindJobPanel
        open={
          Boolean(jobId) &&
          !confirmBind &&
          !addEndpoint &&
          !confirmDeleteGroup &&
          !deleteEndpoint
        }
        jobId={jobId ?? ''}
        draftCount={draftCount}
        contour={contour}
        groups={groups}
        bindGroup={bindGroup}
        endpoints={endpoints}
      />
      <AddEndpointDialog
        open={addEndpoint}
        groups={groups}
        group={addGroup}
        path={addPath}
        httpMethod={addHttpMethod}
        summary={addSummary}
        contour={contour}
        cancelHref={listHref}
        reason={addEndpoint ? reason : null}
      />
      <ConfirmDialog
        open={Boolean(confirmDeleteGroup)}
        title={`Удалить группу «${confirmDeleteGroup ?? ''}»?`}
        description="Вместе с группой удалятся все её эндпоинты. Публичные пути снова ответят 404."
        actionLabel="Удалить группу"
        action="/mocks/groups/delete"
        cancelHref={listHref}
        hiddenFields={[
          { name: 'contour', value: contour },
          { name: 'name', value: confirmDeleteGroup ?? '' },
        ]}
        danger
      />
      <ConfirmDialog
        open={Boolean(deleteEndpoint)}
        title={`Удалить ${deleteEndpoint}?`}
        description="Операция исчезнет из каталога. Сохранённый JSON ответа тоже пропадёт."
        actionLabel="Удалить"
        action="/mocks/endpoints/delete"
        cancelHref={listHref}
        hiddenFields={[
          { name: 'contour', value: contour },
          { name: 'httpMethod', value: confirmDeleteMethod ?? '' },
          { name: 'path', value: confirmDeletePath ?? '' },
        ]}
        danger
      />
      <ConfirmDialog
        open={confirmBind}
        title="Сохранить черновик в ответ?"
        description={
          bindTargets[0]
            ? `JSON ${bindTargets[0]} перезапишется черновиком задания. Один документ уйдёт объектом, несколько — массивом.`
            : 'Выберите эндпоинт.'
        }
        actionLabel="Сохранить"
        action="/mocks/bind"
        cancelHref={mocksListHref(
          contour,
          withJob(bindGroup ? { bindGroup } : {}),
        )}
        hiddenFields={[
          { name: 'contour', value: contour },
          { name: 'jobId', value: jobId ?? '' },
          ...bindTargets.map((value) => ({ name: 'endpoint', value })),
        ]}
      />
    </>
  );
};

MocksPage.displayName = 'MocksPage';

export default MocksPage;
