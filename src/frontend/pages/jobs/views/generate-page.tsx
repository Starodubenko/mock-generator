import type { FC, ReactNode } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Alert, Box, Stack, TextField, Typography } from '@mui/material';
import {
  FIELD_HINTS,
  SEED_FIELD_LABEL,
} from '@frontend/shared/i18n/field-hints';
import {
  formatDocumentType,
  formatReason,
} from '@frontend/shared/i18n/ru-labels';
import { formatContourDateTime } from '@frontend/shared/i18n/format-contour-date-time';
import { formatProfileVersionLabel } from '@frontend/shared/i18n/profile-version-label';
import { rankProfileVersions } from '@frontend/entities/profile-version/rank-profile-versions';
import { ReasonToast } from '@frontend/features/action-toast/ReasonToast';
import { FieldHint } from '@frontend/shared/ui/field-hint/field-hint';
import { FieldLabel } from '@frontend/shared/ui/field-hint/field-label';
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';
import { NoVersionsNotice } from '@frontend/shared/ui/no-versions-notice/no-versions-notice';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { SchemaTree } from '@frontend/shared/ui/schema-tree/schema-tree';
import type { SchemaNode, SchemaPath } from '@frontend/shared/lib/schema-tree';
import { SchemaExpandFrame } from '@frontend/features/schema-expand/schema-expand-frame';
import { ConfirmDialog } from '@frontend/shared/ui/confirm-dialog/confirm-dialog';
import { generateHelp } from '../config/generate-help';
import {
  AddArrayPathButton,
  ArrayPathsField,
  GenerateNavForm,
  GetFormSubmit,
} from '../ui/array-paths-field';

type ConstraintField = {
  path: string;
  kind: 'boolean' | 'category' | 'datetime';
  options: string[];
  datetimeFormat?: string;
};

type Props = PageProps<{
  contour: string;
  documentType?: string;
  reason: string | null;
  seed: string;
  count: string;
  targetIndex: string;
  profileVersionId: string;
  profileVersions?: Array<{
    versionId: string;
    label?: string | null;
    createdAt?: string;
    active: boolean;
  }>;
  timeZone?: string;
  idempotencyKey: string;
  schemaPaths?: SchemaPath[];
  arrayPaths?: string[];
  draftArrayPath?: string;
  confirmAddArrayPath?: string | null;
  confirmRemoveArrayPath?: string | null;
  confirmStart?: boolean;
  constraintValues?: Record<string, string>;
}>;

type ConstraintControlProps = {
  field: ConstraintField;
  defaultValue: string;
};

const constraintControlId = (path: string): string =>
  `constraint-${path.split('.').join('-')}`;

const constraintFromNode = (node: SchemaNode): ConstraintField | null => {
  if (node.pathClass === 'boolean') {
    return { path: node.path, kind: 'boolean', options: ['true', 'false'] };
  }
  if (node.pathClass === 'category') {
    return {
      path: node.path,
      kind: 'category',
      options: node.categoryValues ?? [],
    };
  }
  if (node.pathClass === 'datetime') {
    return {
      path: node.path,
      kind: 'datetime',
      options: [],
      datetimeFormat: node.datetimeFormat,
    };
  }
  return null;
};

const CONSTRAINT_CONTROL_WIDTH = '200px';

const withFieldHint = (hint: string, control: ReactNode): ReactNode => (
  <Box
    data-constraint-control=""
    sx={{
      display: 'grid',
      gridTemplateColumns: '200px 22px',
      columnGap: '8px',
      alignItems: 'center',
      width: '230px',
      flexShrink: 0,
    }}
  >
    <Box
      sx={{
        width: CONSTRAINT_CONTROL_WIDTH,
        minWidth: CONSTRAINT_CONTROL_WIDTH,
        maxWidth: CONSTRAINT_CONTROL_WIDTH,
      }}
    >
      {control}
    </Box>
    <FieldHint text={hint} />
  </Box>
);

const ConstraintControl: FC<ConstraintControlProps> = (props) => {
  const { field, defaultValue } = props;
  const id = constraintControlId(field.path);
  const name = `constraint.${field.path}`;
  if (field.kind === 'boolean') {
    return withFieldHint(
      FIELD_HINTS.constraintBoolean,
      <KitSelect
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-label={field.path}
        fullWidth
        maxWidth={CONSTRAINT_CONTROL_WIDTH}
        options={[
          { value: '', label: 'Все из профиля' },
          { value: 'true', label: 'true' },
          { value: 'false', label: 'false' },
          { value: 'true,false', label: 'true и false' },
        ]}
      />,
    );
  }
  if (field.kind === 'category') {
    return withFieldHint(
      FIELD_HINTS.constraintCategory,
      <KitSelect
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-label={field.path}
        fullWidth
        maxWidth={CONSTRAINT_CONTROL_WIDTH}
        options={[
          { value: '', label: 'Все из профиля' },
          ...field.options.map((option) => ({ value: option, label: option })),
        ]}
      />,
    );
  }
  return withFieldHint(
    FIELD_HINTS.constraintDatetime,
    <TextField
      id={id}
      name={name}
      type={field.datetimeFormat === 'date' ? 'date' : 'text'}
      defaultValue={defaultValue}
      size="small"
      sx={{
        width: CONSTRAINT_CONTROL_WIDTH,
        minWidth: CONSTRAINT_CONTROL_WIDTH,
      }}
      slotProps={{ htmlInput: { 'aria-label': field.path } }}
    />,
  );
};

export const GeneratePage: FC<Props> = (props) => {
  const {
    contour,
    documentType = 'document',
    reason,
    seed,
    count,
    targetIndex,
    profileVersionId,
    profileVersions = [],
    timeZone = 'UTC',
    idempotencyKey,
    schemaPaths = [],
    arrayPaths = [],
    draftArrayPath = '',
    confirmAddArrayPath = null,
    confirmRemoveArrayPath = null,
    confirmStart = false,
    constraintValues = {},
  } = props;
  const rankedVersions = rankProfileVersions(
    profileVersions.map((item) => ({
      ...item,
      createdAt: item.createdAt ?? '',
    })),
  );
  const versionOptions =
    profileVersionId &&
    !rankedVersions.some((item) => item.versionId === profileVersionId)
      ? [
          ...rankedVersions,
          { versionId: profileVersionId, createdAt: '', active: false },
        ]
      : rankedVersions;
  const hasVersions = versionOptions.length > 0;
  const selectedVersion = versionOptions.find(
    (item) => item.versionId === profileVersionId,
  );
  const versionLabel = selectedVersion
    ? formatProfileVersionLabel(selectedVersion)
    : profileVersionId || 'Рабочая версия контура';
  const trainHref = `/profiles/${documentType}?contour=${encodeURIComponent(contour)}`;
  const formHidden = [
    { name: 'contour', value: contour },
    { name: 'documentType', value: documentType },
    { name: 'profileVersionId', value: profileVersionId },
    { name: 'seed', value: seed },
    { name: 'count', value: count },
    { name: 'targetIndex', value: targetIndex },
    { name: 'idempotencyKey', value: idempotencyKey },
    ...arrayPaths.map((path) => ({ name: 'arrayPath', value: path })),
    ...Object.entries(constraintValues).map(([path, value]) => ({
      name: `constraint.${path}`,
      value,
    })),
  ];
  const generateHref = (paths = arrayPaths): string => {
    const params = new URLSearchParams({
      contour,
      documentType,
      profileVersionId,
      seed,
      count,
      targetIndex,
    });
    paths.forEach((path) => params.append('arrayPath', path));
    Object.entries(constraintValues).forEach(([path, value]) => {
      params.set(`constraint.${path}`, value);
    });
    return `/jobs/new?${params.toString()}`;
  };
  const startDescription = arrayPaths.length
    ? `Один объект модели, в массивах ${arrayPaths.join(', ')} будет по ${count} элементов.`
    : `Будет сгенерирован список из ${count} корневых документов.`;
  return (
    <>
      {hasVersions ? (
        <GenerateNavForm
          fields={[
            ...formHidden,
            { name: 'draftArrayPath', value: draftArrayPath },
          ]}
        />
      ) : null}
      <PageWithHelp markdown={generateHelp(contour)}>
        <PagePanel lockScroll>
          <Stack
            spacing={3}
            sx={{
              minHeight: 0,
              height: { md: '100%' },
              flex: { md: 1 },
              overflow: 'hidden',
            }}
          >
            <Box>
              <Typography variant="h5">Генерация документов</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {formatDocumentType(documentType)}
              </Typography>
            </Box>
            {reason ? (
              <Alert severity="error">{formatReason(reason)}</Alert>
            ) : null}
            <ReasonToast reason={reason} />
            {!hasVersions ? (
              <NoVersionsNotice
                contour={contour}
                trainHref={trainHref}
                description="Генерация строится по обученному профилю. Приложите эталон на вкладке обучения — форма появится после этого."
              />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gridTemplateRows: {
                    xs: 'auto auto auto auto minmax(0, 1fr)',
                    sm: 'auto auto minmax(0, 1fr)',
                  },
                  gap: 2,
                  alignItems: 'stretch',
                  minWidth: 0,
                  minHeight: 0,
                  flex: { md: 1 },
                  width: 1,
                  overflow: 'hidden',
                }}
              >
                <Stack
                  component="form"
                  method="get"
                  action="/jobs/new"
                  spacing={0}
                  sx={{ minWidth: 0 }}
                >
                  <input type="hidden" name="contour" value={contour} />
                  <input
                    type="hidden"
                    name="documentType"
                    value={documentType}
                  />
                  {arrayPaths.map((path) => (
                    <input
                      key={`version-array-${path}`}
                      type="hidden"
                      name="arrayPath"
                      value={path}
                    />
                  ))}
                  <FieldLabel
                    htmlFor="profile-version-select"
                    hint={FIELD_HINTS.profileVersion}
                  >
                    Версия профиля для полей
                  </FieldLabel>
                  <KitSelect
                    id="profile-version-select"
                    name="profileVersionId"
                    defaultValue={profileVersionId}
                    submitOnChange
                    options={[
                      { value: '', label: 'Рабочая версия контура' },
                      ...versionOptions.map((item) => {
                        const when = formatContourDateTime(
                          item.createdAt,
                          timeZone,
                        );
                        return {
                          value: item.versionId,
                          label: when
                            ? `${formatProfileVersionLabel(item)} · ${when}`
                            : formatProfileVersionLabel(item),
                        };
                      }),
                    ]}
                  />
                </Stack>
                <Box
                  component="form"
                  method="post"
                  action="/jobs"
                  sx={{ display: 'contents' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <input
                      type="hidden"
                      name="documentType"
                      value={documentType}
                    />
                    <input type="hidden" name="contour" value={contour} />
                    <input
                      type="hidden"
                      name="idempotencyKey"
                      value={idempotencyKey}
                    />
                    <input
                      type="hidden"
                      name="profileVersionId"
                      value={profileVersionId}
                    />
                    <input
                      type="hidden"
                      name="targetIndex"
                      value={targetIndex}
                    />
                    {arrayPaths.map((path) => (
                      <input
                        key={`job-array-${path}`}
                        type="hidden"
                        name="arrayPath"
                        value={path}
                      />
                    ))}
                    <FieldLabel htmlFor="generate-seed" hint={FIELD_HINTS.seed}>
                      {SEED_FIELD_LABEL}
                    </FieldLabel>
                    <TextField
                      id="generate-seed"
                      name="seed"
                      size="small"
                      fullWidth
                      hiddenLabel
                      defaultValue={seed}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <FieldLabel
                      htmlFor="generate-count"
                      hint={FIELD_HINTS.count}
                    >
                      Количество документов
                    </FieldLabel>
                    <TextField
                      id="generate-count"
                      name="count"
                      type="number"
                      size="small"
                      fullWidth
                      hiddenLabel
                      defaultValue={count}
                    />
                  </Box>
                  <ArrayPathsField
                    paths={arrayPaths}
                    draftPath={draftArrayPath}
                  />
                  <Stack
                    spacing={1.5}
                    sx={{
                      gridColumn: '1 / -1',
                      minWidth: 0,
                      minHeight: 0,
                      height: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {schemaPaths.length > 0 ? (
                      <>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            flexShrink: 0,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ alignItems: 'center' }}
                          >
                            <Typography variant="subtitle1">
                              Схема документа
                            </Typography>
                            <FieldHint text={FIELD_HINTS.documentSchema} />
                          </Stack>
                          <GetFormSubmit
                            name="confirmStart"
                            value="1"
                            look="contained"
                            ariaLabel={FIELD_HINTS.startGenerate}
                          >
                            Запустить задание
                          </GetFormSubmit>
                        </Stack>
                        <SchemaExpandFrame
                          versionLabel={versionLabel}
                          seed={seed}
                          count={count}
                          expandedActions={
                            <GetFormSubmit
                              name="confirmStart"
                              value="1"
                              look="contained"
                              ariaLabel={FIELD_HINTS.startGenerate}
                            >
                              Запустить задание
                            </GetFormSubmit>
                          }
                        >
                          <SchemaTree
                            fill
                            paths={schemaPaths}
                            renderControl={(node) => {
                              const field = constraintFromNode(node);
                              return field ? (
                                <ConstraintControl
                                  field={field}
                                  defaultValue={
                                    constraintValues[field.path] ?? ''
                                  }
                                />
                              ) : null;
                            }}
                            renderArrayAction={(node) => (
                              <AddArrayPathButton
                                path={node.path}
                                selected={arrayPaths.includes(node.path)}
                              />
                            )}
                          />
                        </SchemaExpandFrame>
                      </>
                    ) : (
                      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                        <Alert severity="info">
                          Нет активной версии на контуре — схема появится после
                          обучения и активации.
                        </Alert>
                        <GetFormSubmit
                          name="confirmStart"
                          value="1"
                          look="contained"
                          ariaLabel={FIELD_HINTS.startGenerate}
                        >
                          Запустить задание
                        </GetFormSubmit>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Box>
            )}
          </Stack>
        </PagePanel>
      </PageWithHelp>
      <ConfirmDialog
        open={Boolean(confirmAddArrayPath)}
        title={`Добавить путь «${confirmAddArrayPath ?? ''}»?`}
        description="В пачке будет один объект модели. Список документов соберётся только в этом массиве. Повтор пути не добавится."
        actionLabel="Добавить путь"
        action="/jobs/new"
        method="get"
        cancelHref={generateHref()}
        hiddenFields={[
          ...formHidden,
          { name: 'arrayPath', value: confirmAddArrayPath ?? '' },
        ]}
      />
      <ConfirmDialog
        open={Boolean(confirmRemoveArrayPath)}
        title={`Убрать путь «${confirmRemoveArrayPath ?? ''}»?`}
        description="Массив останется в схеме, но пачка снова не будет в него разворачиваться."
        actionLabel="Убрать путь"
        action="/jobs/new"
        method="get"
        cancelHref={generateHref()}
        hiddenFields={formHidden.filter(
          (field) =>
            !(
              field.name === 'arrayPath' &&
              field.value === confirmRemoveArrayPath
            ),
        )}
      />
      <ConfirmDialog
        open={confirmStart}
        title="Запустить генерацию?"
        description={startDescription}
        actionLabel="Запустить задание"
        action="/jobs"
        cancelHref={generateHref()}
        hiddenFields={formHidden}
      />
    </>
  );
};

GeneratePage.displayName = 'GeneratePage';

export default GeneratePage;
