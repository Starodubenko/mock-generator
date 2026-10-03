import type { FC } from 'react';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Box, Typography } from '@mui/material';
import { formatJsonLeaf, jsonLeafKind } from './json-leaf';

type Props = {
  value: unknown;
  name?: string;
  defaultOpen?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const leafColor = (kind: ReturnType<typeof jsonLeafKind>): string => {
  if (kind === 'string') {
    return '#0d7377';
  }
  if (kind === 'number') {
    return '#1a73e8';
  }
  if (kind === 'boolean') {
    return '#9b59b6';
  }
  return '#6b7280';
};

const KeyLabel: FC<{ name?: string }> = (props) => {
  const { name } = props;
  if (name === undefined) {
    return null;
  }
  return (
    <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>
      {name}
      <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>
        :{' '}
      </Box>
    </Box>
  );
};

const NodeSummary: FC<{ name?: string; hint: string }> = (props) => {
  const { name, hint } = props;
  return (
    <Box
      component="summary"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: 'pointer',
        listStyle: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        py: 0.25,
        '&::-webkit-details-marker': { display: 'none' },
      }}
    >
      <ExpandMore
        data-json-chevron=""
        sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }}
      />
      <Typography
        component="span"
        variant="body2"
        sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      >
        <KeyLabel name={name} />
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {hint}
        </Box>
      </Typography>
    </Box>
  );
};

const JsonNode: FC<Props> = (props) => {
  const { value, name, defaultOpen = false } = props;
  if (Array.isArray(value)) {
    return (
      <Box
        component="details"
        open={defaultOpen}
        data-json-node="array"
        sx={{
          '& > summary [data-json-chevron]': { transform: 'rotate(-90deg)' },
          '&[open] > summary [data-json-chevron]': {
            transform: 'rotate(0deg)',
          },
        }}
      >
        <NodeSummary name={name} hint={`[${value.length}]`} />
        <Box
          sx={{
            pl: 2.25,
            borderLeft: '1px solid',
            borderColor: 'divider',
            ml: 1,
          }}
        >
          {(value as unknown[]).map((item, index) => (
            <JsonNode
              key={`${name ?? 'item'}-${index}`}
              name={String(index)}
              value={item}
              defaultOpen={defaultOpen}
            />
          ))}
        </Box>
      </Box>
    );
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    return (
      <Box
        component="details"
        open={defaultOpen}
        data-json-node="object"
        sx={{
          '& > summary [data-json-chevron]': { transform: 'rotate(-90deg)' },
          '&[open] > summary [data-json-chevron]': {
            transform: 'rotate(0deg)',
          },
        }}
      >
        <NodeSummary name={name} hint={`{${keys.length}}`} />
        <Box
          sx={{
            pl: 2.25,
            borderLeft: '1px solid',
            borderColor: 'divider',
            ml: 1,
          }}
        >
          {keys.map((key) => (
            <JsonNode
              key={key}
              name={key}
              value={value[key]}
              defaultOpen={defaultOpen}
            />
          ))}
        </Box>
      </Box>
    );
  }
  const kind = jsonLeafKind(value);
  return (
    <Typography
      data-json-node="leaf"
      variant="body2"
      sx={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'pre',
        py: 0.15,
      }}
    >
      <KeyLabel name={name} />
      <Box component="span" sx={{ color: leafColor(kind) }}>
        {formatJsonLeaf(value)}
      </Box>
    </Typography>
  );
};

export const JsonTree: FC<{ value: unknown; defaultOpen?: boolean }> = (
  props,
) => {
  const { value, defaultOpen = true } = props;
  return (
    <Box
      data-json-tree=""
      sx={{
        width: 'max-content',
        minWidth: '100%',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <JsonNode value={value} defaultOpen={defaultOpen} />
    </Box>
  );
};

JsonTree.displayName = 'JsonTree';
