import type { FC, ReactNode } from 'react';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import { Box, InputAdornment } from '@mui/material';

type Props = {
  text: string;
  tone?: 'default' | 'onPrimary';
  tooltipId?: string;
};

export const FieldHint: FC<Props> = (props) => {
  const { text, tone = 'default', tooltipId } = props;
  return (
    <Box
      component="span"
      data-field-hint=""
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexShrink: 0,
        alignItems: 'center',
        '&:hover [data-field-hint-pop], &:focus-within [data-field-hint-pop]': {
          visibility: 'visible',
          opacity: 1,
        },
      }}
    >
      <Box
        component="button"
        type="button"
        aria-label={text}
        aria-describedby={tooltipId}
        sx={{
          appearance: 'none',
          WebkitAppearance: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          minWidth: '22px',
          m: 0,
          p: 0,
          border: 0,
          borderRadius: '50%',
          bgcolor: 'transparent',
          color: tone === 'onPrimary' ? 'common.white' : 'text.secondary',
          cursor: 'help',
          lineHeight: 1,
        }}
      >
        <HelpOutlineOutlined sx={{ fontSize: 16 }} />
      </Box>
      <Box
        id={tooltipId}
        data-field-hint-pop=""
        role="tooltip"
        sx={{
          visibility: 'hidden',
          opacity: 0,
          position: 'absolute',
          zIndex: 2100,
          left: 0,
          top: 'calc(100% + 8px)',
          width: '320px',
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

FieldHint.displayName = 'FieldHint';

export const textFieldHintSlots = (
  text: string,
): { input: { endAdornment: ReactNode } } => ({
  input: {
    endAdornment: (
      <InputAdornment position="end">
        <FieldHint text={text} />
      </InputAdornment>
    ),
  },
});
