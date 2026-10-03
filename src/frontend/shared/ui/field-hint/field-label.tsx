import type { FC, ReactNode } from 'react';
import { Box, FormLabel } from '@mui/material';
import { FieldHint } from './field-hint';

type Props = {
  htmlFor: string;
  hint: string;
  children: ReactNode;
};

export const FieldLabel: FC<Props> = (props) => {
  const { htmlFor, hint, children } = props;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
      <FormLabel htmlFor={htmlFor} sx={{ m: 0 }}>
        {children}
      </FormLabel>
      <FieldHint text={hint} />
    </Box>
  );
};

FieldLabel.displayName = 'FieldLabel';
