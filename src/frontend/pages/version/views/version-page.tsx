import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  formatDocumentType,
  formatReason,
} from '@frontend/shared/i18n/ru-labels';
import { ReasonToast } from '@frontend/features/action-toast/ReasonToast';
import {
  SchemaExpandFrame,
  type SchemaExpandChip,
} from '@frontend/features/schema-expand/schema-expand-frame';
import {
  SchemaEditButtons,
  SchemaEditDialogs,
} from '@frontend/features/schema-edit/schema-edit-chrome';
import {
  HYSTERESIS_CHIP_HINT,
  VersionDiffChip,
  VersionDiffDialogs,
  diffChipValue,
  type VersionDiffGroup,
} from '@frontend/features/version-diff-chips/version-diff-chips';
import { ConfirmDialog } from '@frontend/shared/ui/confirm-dialog/confirm-dialog';
import { EnumDomainDialog } from '@frontend/shared/ui/enum-domain-dialog/enum-domain-dialog';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { SchemaTree } from '@frontend/shared/ui/schema-tree/schema-tree';
import { VersionLinksTable } from '@frontend/features/version-links/version-links-table';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { VersionCreatedAt } from '@frontend/entities/profile-version/ui/version-created-at';
import { versionHelp } from '../config/help';

type Props = PageProps<{
  documentType: string;
  contour: string;
  timeZone: string;
  versionId: string;
  createdAt: string;
  reason: string | null;
  activeVersionId: string | null;
  rejectedPathCount: number;
  paths: Array<{
    path: string;
    pathClass: string;
    datetimeFormat?: string;
    categoryValues?: string[];
    itemPathClass?: string;
    itemDatetimeFormat?: string;
    itemCategoryValues?: string[];
    typeVariants?: string[];
    nullRate?: number;
  }>;
  parentChildInvariants?: Array<{
    parentPath: string;
    childPath: string;
    arrayPath: string;
  }>;
  valueEqualities?: Array<{
    scope: 'document' | 'array-item';
    arrayPath?: string;
    paths: string[];
  }>;
  dateOrderInvariants?: Array<{ earlierPath: string; laterPath: string }>;
  crossTypeLinks?: Array<{
    localPath: string;
    remoteDocumentType: string;
    remoteField: string;
  }>;
  confirm?: 'activate' | 'rollback' | null;
  editEnumPath?: string | null;
  diff: {
    added: string[];
    removed: string[];
    typeChanged: string[];
    rejected: string[];
    keptByHysteresis: string[];
  };
}>;

export const VersionPage: FC<Props> = (props) => {
  const {
    documentType,
    contour,
    timeZone,
    versionId,
    createdAt,
    reason,
    activeVersionId,
    rejectedPathCount,
    confirm = null,
    editEnumPath = null,
    paths,
    parentChildInvariants = [],
    valueEqualities = [],
    dateOrderInvariants = [],
    crossTypeLinks = [],
    diff,
  } = props;
  const versionHref = `/profiles/${documentType}/versions/${versionId}?contour=${encodeURIComponent(contour)}`;
  const editValues =
    paths.find((item) => item.path === editEnumPath)?.categoryValues ?? [];
  const activateHref = `/profiles/${documentType}/versions/${versionId}/confirm/activate?contour=${encodeURIComponent(contour)}`;
  const diffGroups: VersionDiffGroup[] = [
    {
      field: 'added',
      label: 'Добавлено',
      title: 'Добавленные поля',
      items: diff.added,
    },
    {
      field: 'removed',
      label: 'Удалено',
      title: 'Удалённые поля',
      items: diff.removed,
    },
    {
      field: 'type-changed',
      label: 'Смена типа',
      title: 'Смена типа',
      items: diff.typeChanged,
    },
    {
      field: 'hysteresis',
      label: 'Удержано гистерезисом',
      title: 'Удержано гистерезисом',
      items: diff.keptByHysteresis,
      hint: HYSTERESIS_CHIP_HINT,
    },
  ];
  const summary: SchemaExpandChip[] = [
    {
      label: 'Отклонённых путей',
      value: String(rejectedPathCount),
      field: 'rejected',
    },
    {
      label: 'Активная версия',
      value: activeVersionId ?? 'нет',
      field: 'active',
    },
    ...diffGroups.map((group) => ({
      label: group.label,
      value: diffChipValue(group.items),
      field: group.field,
      interactive: group.items.length > 0,
      hint: group.hint,
    })),
  ];
  const activateButton = (
    <Button href={activateHref} variant="contained" size="small">
      Активировать
    </Button>
  );
  const rollbackButton =
    activeVersionId && activeVersionId !== versionId ? (
      <Button
        href={`/profiles/${documentType}/versions/${versionId}/confirm/rollback?contour=${encodeURIComponent(contour)}`}
        color="error"
        size="small"
      >
        Откатить на {activeVersionId}
      </Button>
    ) : null;
  const headerActions = (
    <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
      {rollbackButton}
      <SchemaEditButtons />
      {activateButton}
    </Stack>
  );

  return (
    <PageWithHelp markdown={versionHelp(contour)}>
      <PagePanel lockScroll>
        <Box
          data-version-diff=""
          sx={{
            minHeight: 0,
            height: { md: '100%' },
            flex: { md: 1 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
        <Box
          data-schema-edit=""
          data-schema-editing="false"
          sx={{
            minHeight: 0,
            height: { md: '100%' },
            flex: { md: 1 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
            '&[data-schema-editing="true"] [data-schema-type-view]': {
              display: 'none',
            },
            '&[data-schema-editing="true"] [data-schema-type-edit]': {
              display: 'flex',
            },
            '&[data-schema-editing="true"] [data-schema-name-view]': {
              display: 'none',
            },
            '&[data-schema-editing="true"] [data-schema-name-edit]': {
              display: 'block',
            },
            '&[data-schema-editing="true"] [data-schema-type-slot]': {
              width: 'auto',
              minWidth: '78px',
            },
            '&[data-schema-editing="true"] [data-schema-enum-tail]': {
              display: 'none',
            },
          }}
        >
          <Box
            component="form"
            method="post"
            action={`/profiles/${documentType}/versions/${versionId}/schema`}
            sx={{
              minHeight: 0,
              height: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <input type="hidden" name="contour" value={contour} />
            <Stack
              spacing={2}
              sx={{
                minHeight: 0,
                height: { md: '100%' },
                flex: { md: 1 },
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h5">
                  Версия {versionId} ({formatDocumentType(documentType)})
                </Typography>
                <VersionCreatedAt createdAt={createdAt} timeZone={timeZone} />
              </Stack>
              {reason ? (
                <Alert severity="warning">{formatReason(reason)}</Alert>
              ) : null}
              <ReasonToast reason={reason} severity="warning" />
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap', gap: 1, flexShrink: 0 }}
              >
                {summary.map((item) => (
                  <VersionDiffChip
                    key={item.field}
                    label={item.label}
                    value={item.value}
                    field={item.field}
                    interactive={item.interactive}
                    hint={item.hint}
                  />
                ))}
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                  flexShrink: 0,
                  minWidth: 0,
                }}
              >
                {headerActions}
              </Stack>
              <SchemaExpandFrame
                chips={summary}
                expandedActions={headerActions}
                aside={
                  <VersionLinksTable
                    pathOptions={paths.map((item) => item.path)}
                    links={{
                      parentChildInvariants,
                      valueEqualities,
                      dateOrderInvariants,
                      crossTypeLinks,
                    }}
                  />
                }
              >
                <SchemaTree typeEdit paths={paths} />
              </SchemaExpandFrame>
              <SchemaEditDialogs />
              <VersionDiffDialogs groups={diffGroups} />
            </Stack>
          </Box>
          <ConfirmDialog
            open={confirm === 'activate'}
            title="Сделать версию рабочей?"
            description="Генерация на этом контуре начнёт брать эту версию. Предыдущая рабочая останется в журнале и её можно вернуть откатом."
            actionLabel="Активировать"
            action={`/profiles/${documentType}/versions/${versionId}/activate`}
            cancelHref={versionHref}
            hiddenFields={[{ name: 'contour', value: contour }]}
          />
          <ConfirmDialog
            open={confirm === 'rollback'}
            title="Откатить рабочую версию?"
            description="Рабочей снова станет предыдущая версия. Текущая не удаляется — её можно активировать позже."
            actionLabel={`Откатить на ${activeVersionId ?? ''}`}
            action={`/profiles/${documentType}/rollback`}
            cancelHref={versionHref}
            hiddenFields={[
              { name: 'contour', value: contour },
              { name: 'versionId', value: activeVersionId ?? '' },
            ]}
            danger
          />
          <EnumDomainDialog
            open={Boolean(editEnumPath) && !confirm}
            path={editEnumPath ?? ''}
            values={editValues}
            action={`/profiles/${documentType}/versions/${versionId}/enums`}
            cancelHref={versionHref}
            contour={contour}
          />
        </Box>
        </Box>
      </PagePanel>
    </PageWithHelp>
  );
};

VersionPage.displayName = 'VersionPage';

export default VersionPage;
