import type { FC } from 'react';
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { FieldHint } from '@frontend/shared/ui/field-hint/field-hint';
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';
import { VersionSection } from '@frontend/shared/ui/version-section/version-section';
import {
  LINK_ADD_KIND_HINT,
  flattenVersionLinks,
  linkKindHint,
  linkKindLabel,
  linkPathsLabel,
  linkScopeLabel,
  type VersionLinkFields,
  type VersionLinkRow,
} from './flatten-version-links';
import { VERSION_LINKS_RUNTIME } from './version-links-runtime';

type Props = {
  links: VersionLinkFields;
  pathOptions: string[];
};

const hiddenFields = (row: VersionLinkRow, index: number) => {
  const fields: Array<[string, string]> = [['linkKind', row.kind]];
  if (row.parentPath) {
    fields.push(['linkParent', row.parentPath]);
  }
  if (row.childPath) {
    fields.push(['linkChild', row.childPath]);
  }
  if (row.arrayPath) {
    fields.push(['linkArray', row.arrayPath]);
  }
  if (row.scope) {
    fields.push(['linkScope', row.scope]);
  }
  if (row.paths?.length) {
    fields.push(['linkPaths', row.paths.join(',')]);
  }
  if (row.earlierPath) {
    fields.push(['linkEarlier', row.earlierPath]);
  }
  if (row.laterPath) {
    fields.push(['linkLater', row.laterPath]);
  }
  if (row.localPath) {
    fields.push(['linkLocal', row.localPath]);
  }
  if (row.remoteDocumentType) {
    fields.push(['linkRemoteType', row.remoteDocumentType]);
  }
  if (row.remoteField) {
    fields.push(['linkRemoteField', row.remoteField]);
  }
  return fields.map(([name, value]) => (
    <input key={name} type="hidden" name={`${name}:${index}`} value={value} />
  ));
};

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

export const VersionLinksTable: FC<Props> = (props) => {
  const { links, pathOptions } = props;
  const rows = flattenVersionLinks(links);
  const options = pathOptions.map((path) => ({ value: path, label: path }));
  return (
    <Stack spacing={1} data-version-links="" sx={{ minWidth: 0, flexShrink: 0 }}>
      <VersionSection title="Настройки связей" panel="links">
      {rows.length === 0 ? (
        <Typography data-version-links-empty="" color="text.secondary">
          Связей нет. Добавьте вручную или обучите на корпусе с повторяющимися
          id
        </Typography>
      ) : null}
      <Table size="small" sx={{ display: rows.length ? 'table' : 'none' }}>
        <TableHead>
          <TableRow>
            <TableCell>Вид</TableCell>
            <TableCell>Область</TableCell>
            <TableCell>Пути</TableCell>
            <TableCell sx={{ width: 96 }} />
          </TableRow>
        </TableHead>
        <TableBody data-version-link-rows="">
          {rows.map((row, index) => (
            <TableRow key={`${row.kind}-${index}`} data-version-link-row="">
              <TableCell>
                {hiddenFields(row, index)}
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: 'center' }}
                  data-link-kind-hint={row.kind}
                >
                  {linkKindLabel(row.kind)}
                  <FieldHint
                    text={linkKindHint(row.kind)}
                    tooltipId={`link-kind-hint-${index}`}
                  />
                </Stack>
              </TableCell>
              <TableCell>{linkScopeLabel(row)}</TableCell>
              <TableCell>{linkPathsLabel(row)}</TableCell>
              <TableCell>
                <Button
                  data-link-remove=""
                  type="button"
                  size="small"
                  sx={{ display: 'none' }}
                >
                  Удалить
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </VersionSection>
      <Box sx={dialogSx} data-link-add-dialog="">
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            minWidth: 360,
            maxWidth: 560,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Добавить связь
          </Typography>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center' }}
            >
              <Typography variant="body2">Вид связи</Typography>
              <FieldHint
                text={LINK_ADD_KIND_HINT}
                tooltipId="link-add-kind-hint"
              />
            </Stack>
            <Box data-link-add-kind="">
              <KitSelect
                id="link-add-kind"
                defaultValue="parent-child"
                options={[
                  { value: 'parent-child', label: 'родитель → ребёнок' },
                  { value: 'equality', label: 'одно значение' },
                  { value: 'date-order', label: 'порядок дат' },
                  { value: 'cross-type', label: 'другой тип' },
                ]}
              />
            </Box>
            <Box data-link-add-parent="">
              <KitSelect id="link-add-parent" options={options} />
            </Box>
            <Box data-link-add-array="">
              <KitSelect id="link-add-array" options={options} />
            </Box>
            <Box data-link-add-child="">
              <KitSelect id="link-add-child" options={options} />
            </Box>
            <Box data-link-add-paths="">
              <KitSelect id="link-add-paths" options={options} />
            </Box>
            <Box data-link-add-earlier="">
              <KitSelect id="link-add-earlier" options={options} />
            </Box>
            <Box data-link-add-later="">
              <KitSelect id="link-add-later" options={options} />
            </Box>
            <Box data-link-add-local="">
              <KitSelect id="link-add-local" options={options} />
            </Box>
            <Box data-link-add-remote-type="">
              <KitSelect
                id="link-add-remote-type"
                defaultValue="document"
                options={[{ value: 'document', label: 'document' }]}
              />
            </Box>
            <Box data-link-add-remote-field="">
              <KitSelect
                id="link-add-remote-field"
                defaultValue="id"
                options={[{ value: 'id', label: 'id' }]}
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Button data-link-add-back="" type="button" size="small">
                Отмена
              </Button>
              <Button data-link-add-confirm="" type="button" size="small" variant="contained">
                Добавить
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
      <script dangerouslySetInnerHTML={{ __html: VERSION_LINKS_RUNTIME }} />
    </Stack>
  );
};

VersionLinksTable.displayName = 'VersionLinksTable';
