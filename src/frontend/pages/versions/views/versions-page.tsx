import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Alert, Button, Chip, Stack, Typography } from '@mui/material';
import {
  formatDocumentType,
  formatReason,
} from '@frontend/shared/i18n/ru-labels';
import { formatProfileVersionLabel } from '@frontend/shared/i18n/profile-version-label';
import { ReasonToast } from '@frontend/features/action-toast/ReasonToast';
import { NoVersionsNotice } from '@frontend/shared/ui/no-versions-notice/no-versions-notice';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { ConfirmDialog } from '@frontend/shared/ui/confirm-dialog/confirm-dialog';
import { rankProfileVersions } from '@frontend/entities/profile-version/rank-profile-versions';
import { VersionCreatedAt } from '@frontend/entities/profile-version/ui/version-created-at';
import { TrainAliasPrompt } from '@frontend/features/versions-pending/TrainAliasPrompt';
import { versionsHelp } from '../config/help';

type VersionRow = {
  versionId: string;
  label: string | null;
  createdAt: string;
  active: boolean;
  activatable: boolean;
};

type Props = PageProps<{
  documentType: string;
  contour: string;
  reason: string | null;
  versions: VersionRow[];
  confirmDelete: string | null;
  confirmActivate: string | null;
  nameVersion: string | null;
  pendingHref: string | null;
  timeZone: string;
}>;

export const VersionsPage: FC<Props> = (props) => {
  const {
    documentType,
    contour,
    reason,
    versions,
    confirmDelete,
    confirmActivate,
    nameVersion,
    pendingHref,
    timeZone,
  } = props;
  const listHref = `/profiles/${documentType}/versions?contour=${encodeURIComponent(contour)}`;
  const trainHref = `/profiles/${documentType}?contour=${encodeURIComponent(contour)}`;
  const typeLabel = formatDocumentType(documentType);
  const showEmpty = versions.length === 0 && !pendingHref;

  return (
    <PageWithHelp markdown={versionsHelp(contour)}>
      <PagePanel>
        <Stack spacing={2}>
          <Typography variant="h5">Версии: {typeLabel}</Typography>
          {reason ? (
            <Alert severity="error">{formatReason(reason)}</Alert>
          ) : null}
          <ReasonToast reason={reason} />
          {showEmpty ? (
            <NoVersionsNotice
              contour={contour}
              trainHref={trainHref}
              description="Список версий появится после обучения. Приложите эталон на вкладке обучения."
            />
          ) : null}
          {rankProfileVersions(versions).map((version) => (
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
              <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ wordBreak: 'break-all' }}>
                  {formatProfileVersionLabel({
                    versionId: version.versionId,
                    label: version.label,
                  })}
                </Typography>
                <VersionCreatedAt
                  createdAt={version.createdAt}
                  timeZone={timeZone}
                />
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ flexWrap: 'wrap', gap: 0.75 }}
                >
                  <Chip size="small" variant="outlined" label={typeLabel} />
                  {version.active ? (
                    <Chip size="small" color="success" label="текущий" />
                  ) : null}
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  href={`/profiles/${documentType}/versions/${version.versionId}?contour=${encodeURIComponent(contour)}`}
                >
                  Открыть
                </Button>
                {version.active || !version.activatable ? null : (
                  <Button
                    size="small"
                    variant="contained"
                    href={`${listHref}&confirmActivate=${encodeURIComponent(version.versionId)}`}
                  >
                    Активировать
                  </Button>
                )}
                {version.active ? null : (
                  <Button
                    size="small"
                    color="error"
                    href={`${listHref}&confirmDelete=${encodeURIComponent(version.versionId)}`}
                  >
                    Удалить
                  </Button>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
        <ConfirmDialog
          open={Boolean(confirmActivate)}
          title="Сделать версию текущей?"
          description="Генерация на этом контуре начнёт брать эту версию. Предыдущая текущая останется в журнале и её можно вернуть откатом."
          actionLabel="Активировать"
          action={`/profiles/${documentType}/versions/${confirmActivate ?? ''}/activate`}
          cancelHref={listHref}
          hiddenFields={[
            { name: 'contour', value: contour },
            { name: 'returnTo', value: 'list' },
          ]}
        />
        <ConfirmDialog
          open={Boolean(confirmDelete)}
          title="Удалить версию?"
          description="Версия исчезнет из списка этого контура. Хэш и эталон заново не собираются. Текущую версию так удалить нельзя."
          actionLabel="Удалить"
          action={`/profiles/${documentType}/versions/${confirmDelete ?? ''}/delete`}
          cancelHref={listHref}
          hiddenFields={[{ name: 'contour', value: contour }]}
          danger
        />
        <TrainAliasPrompt
          contour={contour}
          openType={documentType}
          nameVersion={nameVersion}
          pendingHref={pendingHref}
          cancelHref={listHref}
          actionPrefix={`/profiles/${documentType}/versions/`}
        />
      </PagePanel>
    </PageWithHelp>
  );
};

VersionsPage.displayName = 'VersionsPage';

export default VersionsPage;
