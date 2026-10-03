import type { FC, ReactNode } from 'react';
import { Box } from '@mui/material';

type Props = {
  text: string;
  tooltipId?: string;
  children: ReactNode;
};

export const HoverTip: FC<Props> = (props) => {
  const { text, tooltipId, children } = props;
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        maxWidth: '100%',
        '&:hover [data-hover-tip], &:focus-within [data-hover-tip]': {
          visibility: 'visible',
          opacity: 1,
        },
      }}
    >
      {children}
      <Box
        id={tooltipId}
        data-hover-tip=""
        role="tooltip"
        sx={{
          visibility: 'hidden',
          opacity: 0,
          position: 'absolute',
          zIndex: 2100,
          left: 0,
          top: 'calc(100% + 8px)',
          width: 360,
          px: 1.25,
          py: 1,
          borderRadius: 1,
          bgcolor: 'grey.900',
          color: 'common.white',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.45,
          boxShadow: 3,
          pointerEvents: 'none',
          whiteSpace: 'normal',
          textAlign: 'left',
        }}
      >
        {text}
      </Box>
    </Box>
  );
};

HoverTip.displayName = 'HoverTip';
