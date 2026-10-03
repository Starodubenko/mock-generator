import type { FC } from 'react';
import { Typography } from '@mui/material';
import { formatContourDateTime } from '@frontend/shared/i18n/format-contour-date-time';

type Props = {
  createdAt: string;
  timeZone: string;
};

export const VersionCreatedAt: FC<Props> = (props) => {
  const { createdAt, timeZone } = props;
  const label = formatContourDateTime(createdAt, timeZone);
  if (!label) {
    return null;
  }
  return (
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  );
};

VersionCreatedAt.displayName = 'VersionCreatedAt';
