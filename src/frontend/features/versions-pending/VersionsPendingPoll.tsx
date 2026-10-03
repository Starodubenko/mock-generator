'use client';

import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@mui/material';
import {
  CONSOLE_LIVE_FALLBACK_MS,
  ConsoleLiveConnectionState,
  isTerminalConsoleLiveState,
} from '@frontend/entities/console-live/console-live.contract';
import { consoleNavigate } from '@frontend/shared/lib/console-navigate';
import {
  subscribeConsoleLive,
  subscribeConsoleLiveStatus,
} from '../console-live/connection/console-live.bus';
import { aliasVersionFromLiveEvent } from './alias-version-from-live-event';
import { nameJobFromHref } from './name-job-from-href';

type Props = {
  href: string;
  onReady?: (versionId: string) => void;
};

export const VersionsPendingPoll: FC<Props> = (props) => {
  const { href, onReady } = props;
  const [live, setLive] = useState(false);
  const opened = useRef(false);
  const jobId = nameJobFromHref(href);

  useEffect(
    () =>
      subscribeConsoleLiveStatus((status) =>
        setLive(status === ConsoleLiveConnectionState.Live),
      ),
    [],
  );

  useEffect(() => {
    if (!jobId) {
      return;
    }
    return subscribeConsoleLive((event) => {
      if (event.jobId !== jobId || opened.current) {
        return;
      }
      const versionId = aliasVersionFromLiveEvent(event, jobId);
      if (versionId) {
        opened.current = true;
        if (onReady) {
          onReady(versionId);
          return;
        }
      }
      if (isTerminalConsoleLiveState(event.state)) {
        opened.current = true;
        consoleNavigate(href);
      }
    });
  }, [href, jobId, onReady]);

  useEffect(() => {
    if (live) {
      return;
    }
    const timer = window.setInterval(() => {
      consoleNavigate(href);
    }, CONSOLE_LIVE_FALLBACK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [href, live]);

  return (
    <Alert severity="info">
      Обучение ещё идёт. Когда версия сохранится, откроется окно алиаса.
    </Alert>
  );
};
