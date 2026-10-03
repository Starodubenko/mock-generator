import type { FC, ReactNode } from 'react';
import Close from '@mui/icons-material/Close';
import OpenInFull from '@mui/icons-material/OpenInFull';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { SEED_FIELD_LABEL } from '@frontend/shared/i18n/field-hints';
import { HoverTip } from '@frontend/shared/ui/hover-tip/hover-tip';
import { VersionSection } from '@frontend/shared/ui/version-section/version-section';
import { SCHEMA_EXPAND_RUNTIME } from './schema-expand-runtime';

export type SchemaExpandChip = {
  label: string;
  value: string;
  field: string;
  interactive?: boolean;
  hint?: string;
};

type Props = {
  versionLabel?: string;
  seed?: string;
  count?: string;
  chips?: SchemaExpandChip[];
  expandedActions?: ReactNode;
  fill?: boolean;
  aside?: ReactNode;
  children: ReactNode;
};

const ExpandControl: FC<{ overlay: boolean }> = (props) => {
  const { overlay } = props;
  return (
    <Box
      data-schema-expand-open=""
      sx={{
        flexShrink: 0,
        ...(overlay
          ? {
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
            }
          : {}),
        '&:hover [data-schema-expand-tip], &:focus-within [data-schema-expand-tip]':
          {
            visibility: 'visible',
            opacity: 1,
          },
      }}
    >
      <IconButton
        type="button"
        size="small"
        aria-label="Развернуть"
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: 1,
          '&:hover': { bgcolor: 'grey.50' },
        }}
      >
        <OpenInFull sx={{ fontSize: 18 }} />
      </IconButton>
      <Box
        data-schema-expand-tip=""
        role="tooltip"
        sx={{
          visibility: 'hidden',
          opacity: 0,
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 6px)',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: 'grey.900',
          color: 'common.white',
          fontSize: 12,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: 3,
        }}
      >
        Развернуть
      </Box>
    </Box>
  );
};

const MetaChip: FC<SchemaExpandChip> = (props) => {
  const { label, value, field, interactive = false, hint } = props;
  const chip = (
    <Chip
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      size="small"
      variant="outlined"
      clickable={interactive}
      data-diff-open={interactive ? field : undefined}
      label={
        <Box
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.75 }}
        >
          <Box
            component="span"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            {label}
          </Box>
          <Box
            component="span"
            data-schema-expand-value={field}
            sx={{ fontWeight: 600 }}
          >
            {value || '—'}
          </Box>
        </Box>
      }
    />
  );
  if (!hint) {
    return chip;
  }
  return (
    <HoverTip text={hint} tooltipId={`expand-chip-tip-${field}`}>
      {chip}
    </HoverTip>
  );
};

export const SchemaExpandFrame: FC<Props> = (props) => {
  const {
    versionLabel = '',
    seed = '',
    count = '',
    chips,
    expandedActions,
    fill = true,
    aside,
    children,
  } = props;
  const split = Boolean(aside);
  const meta = chips ?? [
    { label: 'Версия', value: versionLabel, field: 'version' },
    { label: SEED_FIELD_LABEL, value: seed, field: 'seed' },
    { label: 'Документов', value: count, field: 'count' },
  ];
  return (
    <Box
      data-schema-expand=""
      data-schema-expand-split={split ? '' : undefined}
      data-open="false"
      role="region"
      aria-label="Схема документа"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...(fill ? { flex: 1, minHeight: 0 } : { flex: '0 0 auto' }),
        '&[data-open="true"]': {
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          p: 2,
          bgcolor: 'background.paper',
          boxShadow: 24,
          width: '100vw',
          height: '100dvh',
          maxHeight: '100dvh',
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
        },
        '&[data-open="true"] [data-schema-expand-chrome]': { display: 'flex' },
        '&[data-open="true"] [data-schema-expand-open]': { display: 'none' },
        '&[data-open="true"] [data-schema-expand-body]': {
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        },
        '&[data-open="true"][data-schema-expand-split] [data-schema-expand-body]':
          {
            flexDirection: 'row',
            alignItems: 'stretch',
          },
        '&[data-open="true"] [data-schema-expand-main]': {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        },
        '&[data-open="true"] [data-schema-expand-aside]': {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        },
        '&[data-open="true"] [data-schema-tree]': {
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        },
        '&[data-open="true"] [data-version-panel]': {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          height: 0,
          overflow: 'hidden',
          border: 'none',
          bgcolor: 'transparent',
        },
        '&[data-open="true"] [data-version-panel-summary]': { display: 'none' },
        '&[data-open="true"] [data-version-panel-body]': {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          height: 0,
          overflow: 'auto',
          p: 0,
        },
        '&[data-open="true"] [data-version-panel="schema"] [data-schema-tree]':
          {
            flex: '0 0 auto',
            height: 'auto',
            maxHeight: 'none',
          },
      }}
    >
      <Stack
        data-schema-expand-chrome=""
        direction="row"
        spacing={1.5}
        sx={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          pb: 1.5,
          flexShrink: 0,
        }}
      >
        <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" component="h2">
            Схема документа
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {meta.map((item) => (
              <MetaChip
                key={item.field}
                label={item.label}
                value={item.value}
                field={item.field}
                interactive={item.interactive}
              />
            ))}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            data-schema-expand-close=""
            type="button"
            size="small"
            startIcon={<Close />}
          >
            Закрыть
          </Button>
          {expandedActions ?? (
            <Button type="submit" variant="contained" size="small">
              Запустить задание
            </Button>
          )}
        </Stack>
      </Stack>
      <Box
        data-schema-expand-body=""
        data-version-scroll={split ? '' : undefined}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
          ...(fill
            ? {
                flex: 1,
                minHeight: 0,
                overflow: split ? 'auto' : 'hidden',
              }
            : { flex: '0 0 auto' }),
        }}
      >
        <Box
          data-schema-expand-main=""
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            ...(fill && !split
              ? { flex: 1, minHeight: 0 }
              : { flex: '0 0 auto' }),
          }}
        >
          {split ? (
            <VersionSection
              title="Схема документа"
              panel="schema"
              extra={<ExpandControl overlay={false} />}
            >
              {children}
            </VersionSection>
          ) : (
            <>
              <ExpandControl overlay />
              {children}
            </>
          )}
        </Box>
        {aside ? (
          <Box
            data-schema-expand-aside=""
            sx={{ minWidth: 0, flex: '0 0 auto' }}
          >
            {aside}
          </Box>
        ) : null}
      </Box>
      <script dangerouslySetInnerHTML={{ __html: SCHEMA_EXPAND_RUNTIME }} />
    </Box>
  );
};

SchemaExpandFrame.displayName = 'SchemaExpandFrame';
