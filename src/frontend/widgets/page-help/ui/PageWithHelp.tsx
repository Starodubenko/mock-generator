import type { FC, ReactNode } from 'react';
import { Box } from '@mui/material';
import { PageHelp } from './PageHelp';

type Props = {
  markdown: string;
  children: ReactNode;
};

export const PageWithHelp: FC<Props> = (props) => {
  const { markdown, children } = props;
  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        height: { md: '100%' },
        minHeight: 0,
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px' },
        gridTemplateRows: { md: 'minmax(0, 1fr)' },
        gap: 1,
        alignItems: { xs: 'start', md: 'stretch' },
      }}
    >
      <Box
        sx={{
          minWidth: 0,
          width: 1,
          minHeight: 0,
          height: { md: '100%' },
          maxHeight: { md: '100%' },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
          overflow: { md: 'hidden' },
          '& > *': {
            flex: { md: 1 },
            minHeight: { md: 0 },
            maxHeight: { md: '100%' },
          },
        }}
      >
        {children}
      </Box>
      <PageHelp markdown={markdown} />
    </Box>
  );
};
