import type { FC, ReactNode } from 'react';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Box, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  panel: 'schema' | 'links';
  extra?: ReactNode;
  children: ReactNode;
};

export const VersionSection: FC<Props> = (props) => {
  const { title, panel, extra, children } = props;
  return (
    <Box
      component="details"
      open
      data-version-panel={panel}
      sx={{
        minWidth: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        '& > summary': { listStyle: 'none' },
        '& > summary::-webkit-details-marker': { display: 'none' },
        '& [data-version-panel-chevron]': { transform: 'rotate(-90deg)' },
        '&[open] [data-version-panel-chevron]': { transform: 'rotate(0deg)' },
        '&:not([open]) > [data-version-panel-body]': { display: 'none' },
      }}
    >
      <Box
        component="summary"
        data-version-panel-summary=""
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 1.5,
          py: 1,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', minWidth: 0 }}
        >
          <ExpandMore
            data-version-panel-chevron=""
            sx={{ color: 'text.secondary' }}
          />
          <Typography variant="subtitle1">{title}</Typography>
        </Stack>
        {extra}
      </Box>
      <Box
        data-version-panel-body=""
        sx={{ px: 1.5, pb: 1.5, minWidth: 0, minHeight: 0 }}
      >
        {children}
      </Box>
    </Box>
  );
};

VersionSection.displayName = 'VersionSection';
