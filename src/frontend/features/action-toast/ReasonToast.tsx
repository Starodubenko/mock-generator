import type { FC } from 'react';
import { formatReason } from '@frontend/shared/i18n/ru-labels';

type Props = {
  reason: string | null;
  severity?: 'error' | 'warning';
};

export const ReasonToast: FC<Props> = (props) => {
  const { reason, severity = 'error' } = props;
  const message = formatReason(reason);
  if (!message) {
    return null;
  }
  return (
    <span
      hidden
      data-console-toast-seed=""
      data-toast-title="Отказ"
      data-toast-body={message}
      data-toast-severity={severity}
    />
  );
};

ReasonToast.displayName = 'ReasonToast';
