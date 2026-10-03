import type { FC, ReactNode } from 'react';
import { Paper } from '@mui/material';

type Props = {
  children: ReactNode;
  lockScroll?: boolean;
};

export const PagePanel: FC<Props> = (props) => {
  const { children, lockScroll = false } = props;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        width: 1,
        minWidth: 0,
        minHeight: 0,
        height: { md: '100%' },
        maxHeight: { md: '100%' },
        overflow: lockScroll ? 'hidden' : 'auto',
        display: { md: 'flex' },
        flexDirection: { md: 'column' },
        boxSizing: 'border-box',
      }}
    >
      {children}
    </Paper>
  );
};
