import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import {
  formatDocumentType,
  formatReason,
} from '@frontend/shared/i18n/ru-labels';
import { ReasonToast } from '@frontend/features/action-toast/ReasonToast';
import { CorpusDropzone } from '@frontend/features/corpus-dropzone/CorpusDropzone';
import { FieldLabel } from '@frontend/shared/ui/field-hint/field-label';
import { textFieldHintSlots } from '@frontend/shared/ui/field-hint/field-hint';
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { trainHelp } from '../config/help';

type DocumentTypeOption = {
  documentType: string;
  enabled: boolean;
};

type Props = PageProps<{
  documentType: string;
  contour: string;
  reason: string | null;
  sampleSize: string;
  idempotencyKey: string;
  documentTypes?: DocumentTypeOption[];
}>;

export const TrainPage: FC<Props> = (props) => {
  const {
    documentType,
    contour,
    reason,
    sampleSize,
    idempotencyKey,
    documentTypes = [{ documentType, enabled: true }],
  } = props;
  const typeOptions = documentTypes.some(
    (item) => item.documentType === documentType,
  )
    ? documentTypes
    : [{ documentType, enabled: true }, ...documentTypes];

  return (
    <PageWithHelp markdown={trainHelp(contour)}>
      <PagePanel>
        <Stack spacing={2}>
          <Typography variant="h5">Обучение профиля</Typography>
          <Stack
            component="form"
            method="get"
            action={`/profiles/${documentType}`}
            spacing={0}
          >
            <input type="hidden" name="contour" value={contour} />
            <FieldLabel
              htmlFor="train-document-type"
              hint={FIELD_HINTS.documentType}
            >
              Тип документа
            </FieldLabel>
            <KitSelect
              id="train-document-type"
              defaultValue={documentType}
              submitOnChange
              actionPrefix="/profiles/"
              options={typeOptions.map((item) => ({
                value: item.documentType,
                label: formatDocumentType(item.documentType),
              }))}
            />
          </Stack>
          {reason ? (
            <Alert severity="error">{formatReason(reason)}</Alert>
          ) : null}
          <ReasonToast reason={reason} />
          <Stack
            spacing={2}
            component="form"
            method="post"
            action={`/profiles/${documentType}/trainings`}
            encType="multipart/form-data"
            className="train-form"
            sx={{
              '& [data-train-after-corpus]': { display: 'none' },
              '&:has(input[name="corpus"]:valid) [data-train-after-corpus]': {
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              },
              '&:has(input[name="corpus"][data-filled="true"]) [data-train-after-corpus]':
                {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                },
            }}
          >
            <input type="hidden" name="contour" value={contour} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <CorpusDropzone />
            <Stack data-train-after-corpus="" spacing={2}>
              <TextField
                name="sampleSize"
                label="Размер выборки"
                type="number"
                size="small"
                defaultValue={sampleSize}
                slotProps={textFieldHintSlots(FIELD_HINTS.sampleSize)}
              />
              <TextField
                name="aliasFrom"
                label="С какого пути (необязательно)"
                placeholder="например source.kind"
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                  ...textFieldHintSlots(FIELD_HINTS.aliasFrom),
                }}
              />
              <TextField
                name="aliasTo"
                label="На какой путь (необязательно)"
                placeholder="например kind"
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                  ...textFieldHintSlots(FIELD_HINTS.aliasTo),
                }}
              />
              <Button type="submit" variant="contained" size="small">
                Запустить обучение
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </PagePanel>
    </PageWithHelp>
  );
};

TrainPage.displayName = 'TrainPage';

export default TrainPage;
