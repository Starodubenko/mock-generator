import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  formatDocumentType,
  formatReason,
} from '@frontend/shared/i18n/ru-labels';
import { formatProfileVersionLabel } from '@frontend/shared/i18n/profile-version-label';
import { ReasonToast } from '@frontend/features/action-toast/ReasonToast';
import { ConfirmDialog } from '@frontend/shared/ui/confirm-dialog/confirm-dialog';
import { NoVersionsNotice } from '@frontend/shared/ui/no-versions-notice/no-versions-notice';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { rankProfileVersions } from '@frontend/entities/profile-version/rank-profile-versions';
import { VersionCreatedAt } from '@frontend/entities/profile-version/ui/version-created-at';
import { TrainAliasPrompt } from '@frontend/features/versions-pending/TrainAliasPrompt';
import { AddDocumentTypeDialog } from '../ui/add-document-type-dialog';
import { documentTypesHelp } from '../config/help';

type VersionRow = {
  versionId: string;
  label: string | null;
  createdAt: string;
  active: boolean;
  activatable: boolean;
};

type TypeRow = {
  documentType: string;
  versions: VersionRow[];
  activeVersionId: string | null;
  activeVersionLabel: string | null;
};

type Props = PageProps<{
  contour: string;
  reason: string | null;
  types: TypeRow[];
  openType: string | null;
  confirmDeleteType: string | null;
  confirmDeleteVersion: string | null;
  confirmActivate: string | null;
  nameVersion: string | null;
  pendingHref: string | null;
  addType: boolean;
  timeZone: string;
}>;

const typeHref = (
  contour: string,
  documentType: string,
  extras: Record<string, string> = {},
): string => {
  const params = new URLSearchParams({
    contour,
    open: documentType,
    ...extras,
  });
  return `/document-types?${params.toString()}`;
};

export const DocumentTypesPage: FC<Props> = (props) => {
  const {
    contour,
    reason,
    types,
    openType,
    confirmDeleteType,
    confirmDeleteVersion,
    confirmActivate,
    nameVersion,
    pendingHref,
    addType,
    timeZone,
  } = props;
  const listHref = `/document-types?contour=${encodeURIComponent(contour)}`;
  const addHref = openType
    ? `${listHref}&open=${encodeURIComponent(openType)}&addType=1`
    : `${listHref}&addType=1`;
  const confirmType =
    types.find((item) => item.documentType === confirmDeleteType) ?? null;
  const confirmTypeLabel = confirmType
    ? formatDocumentType(confirmType.documentType)
    : '';
  const pageReason = addType ? null : reason;

  return (
    <PageWithHelp markdown={documentTypesHelp(contour)}>
      <PagePanel>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="h5">Типы документов</Typography>
            <Button href={addHref} variant="contained" size="small">
              Добавить тип
            </Button>
          </Stack>
          {pageReason ? (
            <Alert severity="error">{formatReason(pageReason)}</Alert>
          ) : null}
          <ReasonToast reason={reason} />
          {types.length === 0 ? (
            <Alert severity="info">
              Типов ещё нет. Нажмите «Добавить тип», затем обучите профиль.
            </Alert>
          ) : null}
          {types.map((item) => {
            const typeLabel = formatDocumentType(item.documentType);
            const opened = openType === item.documentType;
            const trainHref = `/profiles/${item.documentType}?contour=${encodeURIComponent(contour)}`;
            const selfHref = typeHref(contour, item.documentType);
            return (
              <Paper
                key={item.documentType}
                component="details"
                open={opened}
                variant="outlined"
                sx={{
                  '& summary': { listStyle: 'none' },
                  '& summary::-webkit-details-marker': { display: 'none' },
                  '& [data-type-chevron]': { transform: 'rotate(-90deg)' },
                  '&[open] [data-type-chevron]': { transform: 'rotate(0deg)' },
                }}
              >
                <Box
                  component="summary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    px: 1.5,
                    py: 1.25,
                    cursor: 'pointer',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}
                  >
                    <ExpandMore
                      data-type-chevron=""
                      sx={{ color: 'text.secondary' }}
                    />
                    <Typography variant="subtitle1">{typeLabel}</Typography>
                    {item.activeVersionId ? (
                      <Chip
                        size="small"
                        color="success"
                        label={formatProfileVersionLabel({
                          versionId: item.activeVersionId,
                          label: item.activeVersionLabel,
                        })}
                      />
                    ) : (
                      <Chip
                        size="small"
                        variant="outlined"
                        label="нет профиля"
                      />
                    )}
                  </Stack>
                  <Button
                    size="small"
                    color="error"
                    href={`${listHref}&confirmDeleteType=${encodeURIComponent(item.documentType)}`}
                  >
                    Удалить тип
                  </Button>
                </Box>
                <Stack spacing={1.5} sx={{ px: 1.5, pb: 1.5 }}>
                  {item.versions.length === 0 ? (
                    <NoVersionsNotice
                      contour={contour}
                      trainHref={trainHref}
                      description="Профили этого типа появятся после обучения."
                    />
                  ) : (
                    rankProfileVersions(item.versions).map((version) => (
                      <Stack
                        key={version.versionId}
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1,
                          px: 1.5,
                          py: 1.25,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1.5,
                        }}
                      >
                        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              alignItems: 'center',
                              minWidth: 0,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography sx={{ wordBreak: 'break-all' }}>
                              {formatProfileVersionLabel({
                                versionId: version.versionId,
                                label: version.label,
                              })}
                            </Typography>
                            {version.active ? (
                              <Chip
                                size="small"
                                color="success"
                                label="текущий"
                                sx={{ flexShrink: 0 }}
                              />
                            ) : null}
                          </Stack>
                          <VersionCreatedAt
                            createdAt={version.createdAt}
                            timeZone={timeZone}
                          />
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: 'wrap' }}
                        >
                          <Button
                            size="small"
                            href={`/profiles/${item.documentType}/versions/${version.versionId}?contour=${encodeURIComponent(contour)}`}
                          >
                            Открыть
                          </Button>
                          {version.active || !version.activatable ? null : (
                            <Button
                              size="small"
                              variant="contained"
                              href={`${selfHref}&confirmActivate=${encodeURIComponent(version.versionId)}`}
                            >
                              Активировать
                            </Button>
                          )}
                          {version.active ? null : (
                            <Button
                              size="small"
                              color="error"
                              href={`${selfHref}&confirmDeleteVersion=${encodeURIComponent(version.versionId)}`}
                            >
                              Удалить
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    ))
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
        <ConfirmDialog
          open={Boolean(confirmDeleteType)}
          title={`Удалить тип «${confirmTypeLabel}»?`}
          description="Вместе с типом удалятся все его профили (версии) в этом процессе. Соседний микросервис и поисковый кластер не чистятся. Это нельзя отменить."
          actionLabel="Удалить тип и профили"
          action={`/document-types/${confirmDeleteType ?? ''}/delete`}
          cancelHref={listHref}
          hiddenFields={[{ name: 'contour', value: contour }]}
          danger
        />
        <ConfirmDialog
          open={Boolean(confirmActivate && openType)}
          title="Сделать версию текущей?"
          description="Генерация на этом контуре начнёт брать эту версию. Предыдущая текущая останется в журнале и её можно вернуть откатом."
          actionLabel="Активировать"
          action={`/profiles/${openType ?? ''}/versions/${confirmActivate ?? ''}/activate`}
          cancelHref={openType ? typeHref(contour, openType) : listHref}
          hiddenFields={[
            { name: 'contour', value: contour },
            { name: 'returnTo', value: 'types' },
          ]}
        />
        <ConfirmDialog
          open={Boolean(confirmDeleteVersion && openType)}
          title="Удалить версию?"
          description="Версия исчезнет из списка этого контура. Хэш и эталон заново не собираются. Текущую версию так удалить нельзя."
          actionLabel="Удалить"
          action={`/profiles/${openType ?? ''}/versions/${confirmDeleteVersion ?? ''}/delete`}
          cancelHref={openType ? typeHref(contour, openType) : listHref}
          hiddenFields={[{ name: 'contour', value: contour }]}
          danger
        />
        <TrainAliasPrompt
          contour={contour}
          openType={openType}
          nameVersion={nameVersion}
          pendingHref={pendingHref}
          cancelHref={openType ? typeHref(contour, openType) : listHref}
          actionPrefix={`/profiles/${openType ?? ''}/versions/`}
        />
        <AddDocumentTypeDialog
          open={addType}
          contour={contour}
          cancelHref={openType ? typeHref(contour, openType) : listHref}
          reason={addType ? reason : null}
        />
      </PagePanel>
    </PageWithHelp>
  );
};

DocumentTypesPage.displayName = 'DocumentTypesPage';

export default DocumentTypesPage;
