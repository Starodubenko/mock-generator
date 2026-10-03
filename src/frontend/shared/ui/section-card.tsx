import type { FC, ReactNode } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

type Props = {
  title: string;
  children: ReactNode;
  fill?: boolean;
};

export const SectionCard: FC<Props> = (props) => {
  const { title, children, fill = false } = props;
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        minHeight: fill ? 0 : undefined,
        flex: fill ? 1 : undefined,
        display: fill ? 'flex' : undefined,
        flexDirection: fill ? 'column' : undefined,
        overflow: fill ? 'hidden' : undefined,
      }}
    >
      <CardContent
        sx={
          fill
            ? {
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                '&:last-child': { pb: 2 },
              }
            : undefined
        }
      >
        <Typography variant="h6" component="h2" sx={{ mb: 2, flexShrink: 0 }}>
          {title}
        </Typography>
        {fill ? (
          <Box
            data-section-scroll=""
            sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}
          >
            {children}
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};
