import type { FC } from 'react';
import { Alert, AlertTitle, Button, Typography } from '@mui/material';

type Props = {
  contour: string;
  trainHref: string;
  description: string;
};

export const NoVersionsNotice: FC<Props> = (props) => {
  const { contour, trainHref, description } = props;
  return (
    <Alert
      severity="info"
      variant="outlined"
      sx={{
        alignItems: 'flex-start',
        px: 3,
        py: 2.5,
        '& .MuiAlert-message': { width: 1 },
      }}
    >
      <AlertTitle sx={{ fontSize: 18, fontWeight: 600 }}>
        Нет версий профиля
      </AlertTitle>
      <Typography variant="body2" sx={{ mb: 2, maxWidth: 560 }}>
        {description} На контуре {contour} версий ещё нет.
      </Typography>
      <Button href={trainHref} variant="contained" size="small">
        Обучить
      </Button>
    </Alert>
  );
};

NoVersionsNotice.displayName = 'NoVersionsNotice';
