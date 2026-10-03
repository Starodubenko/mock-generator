import type { FC } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { HoverTip } from '@frontend/shared/ui/hover-tip/hover-tip';
import { formatFieldPhrase, formatPathCount } from './format-path-count';
import { VERSION_DIFF_RUNTIME } from './version-diff-runtime';

export const HYSTERESIS_CHIP_HINT =
  'Гистерезис в генераторе — два порога вместо одного. Путь или значение домена не исчезают после одного слабого обучения и не возвращаются после одного сильного: чтобы убрать, нужно пересечь нижний порог, чтобы вернуть — верхний. Числа порогов задаёт конфиг и не переписывают уже сохранённые версии. Чип считает пути, которые из-за этого остались: между соседними обучениями поле то было, то нет, но порог не пробит. Такое колебание само по себе не блокирует активацию, если тип не менялся.';

export type VersionDiffGroup = {
  field: string;
  label: string;
  title: string;
  items: string[];
  hint?: string;
};

export const diffChipValue = (items: string[]): string =>
  items.length === 0 ? 'нет' : formatPathCount(items.length);

type ChipProps = {
  label: string;
  field: string;
  value: string;
  interactive?: boolean;
  hint?: string;
};

export const VersionDiffChip: FC<ChipProps> = (props) => {
  const { label, field, value, interactive = false, hint } = props;
  const chip = (
    <Chip
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      size="small"
      variant="outlined"
      clickable={interactive}
      data-diff-open={interactive ? field : undefined}
      aria-haspopup={interactive ? 'dialog' : undefined}
      aria-controls={interactive ? `diff-dialog-${field}` : undefined}
      aria-describedby={hint ? `chip-tip-${field}` : undefined}
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
            data-version-chip={field}
            sx={{ fontWeight: 600 }}
          >
            {value}
          </Box>
        </Box>
      }
      sx={{
        height: 'auto',
        maxWidth: '100%',
        cursor: interactive ? 'pointer' : 'default',
        '& .MuiChip-label': { whiteSpace: 'nowrap', py: 0.5 },
      }}
    />
  );
  if (!hint) {
    return chip;
  }
  return (
    <HoverTip text={hint} tooltipId={`chip-tip-${field}`}>
      {chip}
    </HoverTip>
  );
};

type DialogsProps = {
  groups: VersionDiffGroup[];
};

export const VersionDiffDialogs: FC<DialogsProps> = (props) => {
  const { groups } = props;
  return (
    <>
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <Box
            key={group.field}
            id={`diff-dialog-${group.field}`}
            data-diff-dialog={group.field}
            data-open="false"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`diff-dialog-title-${group.field}`}
            sx={{
              display: 'none',
              position: 'fixed',
              inset: 0,
              zIndex: 1650,
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              p: 2,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: 'min(640px, 100%)',
                maxHeight: 'min(80vh, 720px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Stack spacing={1.5} sx={{ p: 3, pb: 2, flexShrink: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      id={`diff-dialog-title-${group.field}`}
                      variant="h6"
                      component="h2"
                    >
                      {group.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFieldPhrase(group.items.length)} относительно
                      активной версии
                    </Typography>
                  </Stack>
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={formatPathCount(group.items.length)}
                  />
                </Stack>
              </Stack>
              <Box
                component="ul"
                data-diff-list={group.field}
                sx={{
                  m: 0,
                  px: 3,
                  pb: 1,
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  listStyle: 'none',
                }}
              >
                {group.items.map((path) => (
                  <Box
                    key={path}
                    component="li"
                    sx={{
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 13,
                      lineHeight: 1.45,
                      wordBreak: 'break-all',
                      '&:last-of-type': { borderBottom: 0 },
                    }}
                  >
                    {path}
                  </Box>
                ))}
              </Box>
              <Stack
                direction="row"
                sx={{ justifyContent: 'flex-end', p: 2, pt: 1.5, flexShrink: 0 }}
              >
                <Button data-diff-close="" type="button" size="small">
                  Закрыть
                </Button>
              </Stack>
            </Paper>
          </Box>
        ))}
      <script dangerouslySetInnerHTML={{ __html: VERSION_DIFF_RUNTIME }} />
    </>
  );
};

VersionDiffChip.displayName = 'VersionDiffChip';
VersionDiffDialogs.displayName = 'VersionDiffDialogs';
