'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { VersionAliasDialog } from '@frontend/shared/ui/version-alias-dialog/version-alias-dialog';
import { subscribeConsoleLive } from '../console-live/connection/console-live.bus';
import { aliasVersionFromLiveEvent } from './alias-version-from-live-event';
import { nameJobFromHref } from './name-job-from-href';
import { VersionsPendingPoll } from './VersionsPendingPoll';

type Props = {
  contour: string;
  openType: string | null;
  nameVersion: string | null;
  pendingHref: string | null;
  cancelHref: string;
  actionPrefix: string;
};

export const TrainAliasPrompt: FC<Props> = (props) => {
  const {
    contour,
    openType,
    nameVersion,
    pendingHref,
    cancelHref,
    actionPrefix,
  } = props;
  const jobId = nameJobFromHref(pendingHref ?? '');
  const [aliasVersion, setAliasVersion] = useState(nameVersion);

  useEffect(() => {
    if (nameVersion) {
      setAliasVersion(nameVersion);
    }
  }, [nameVersion]);

  useEffect(() => {
    if (!jobId) {
      return;
    }
    return subscribeConsoleLive((event) => {
      const versionId = aliasVersionFromLiveEvent(event, jobId);
      if (versionId) {
        setAliasVersion(versionId);
      }
    });
  }, [jobId]);

  return (
    <>
      {pendingHref && !aliasVersion ? (
        <VersionsPendingPoll href={pendingHref} onReady={setAliasVersion} />
      ) : null}
      <VersionAliasDialog
        open={Boolean(aliasVersion && openType)}
        versionId={aliasVersion ?? ''}
        action={`${actionPrefix}${aliasVersion ?? ''}/alias`}
        cancelHref={cancelHref}
        contour={contour}
      />
    </>
  );
};

TrainAliasPrompt.displayName = 'TrainAliasPrompt';
