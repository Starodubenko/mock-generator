'use client';

import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { createActor } from 'xstate';
import { consoleNavigate } from '@frontend/shared/lib/console-navigate';
import { isTerminalJobState } from './is-terminal-job-state';
import { jobStatusPollMachine } from './job-status-poll.machine';
import { formatJobState, formatReason } from '@frontend/shared/i18n/ru-labels';
import {
  CONSOLE_LIVE_FALLBACK_MS,
  ConsoleLiveConnectionState,
  ConsoleLiveJobState,
  ConsoleLiveTestId,
  isConsoleLiveState,
} from '@frontend/entities/console-live/console-live.contract';
import {
  subscribeConsoleLive,
  subscribeConsoleLiveStatus,
} from '../console-live/connection/console-live.bus';
import { consoleLiveFallbackHref } from '../console-live/connection/console-live-path';

type Props = {
  jobId: string;
  state: string;
  reason: string | null;
  succeededHref?: string | null;
};

export const JobStatusSegment: FC<Props> = (props) => {
  const { jobId, state, reason, succeededHref = null } = props;
  const [view, setView] = useState({ state, reason });
  const [live, setLive] = useState(false);
  const actorRef = useRef<ReturnType<
    typeof createActor<typeof jobStatusPollMachine>
  > | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    setView({ state, reason });
  }, [state, reason]);

  useEffect(() => {
    return subscribeConsoleLive((event) => {
      if (event.jobId !== jobId) {
        return;
      }
      setView({ state: event.state, reason: event.reason });
    });
  }, [jobId]);

  useEffect(
    () =>
      subscribeConsoleLiveStatus((status) =>
        setLive(status === ConsoleLiveConnectionState.Live),
      ),
    [],
  );

  useEffect(() => {
    if (
      isConsoleLiveState(view.state, ConsoleLiveJobState.Succeeded) &&
      succeededHref
    ) {
      actorRef.current?.send({ type: 'STOP' });
      if (!redirected.current) {
        redirected.current = true;
        consoleNavigate(succeededHref);
      }
      return;
    }
    if (isTerminalJobState(view.state) || live) {
      actorRef.current?.send({ type: 'STOP' });
      return;
    }
    const actor = createActor(jobStatusPollMachine, { input: { jobId } });
    actor.start();
    actor.send({ type: 'START' });
    actorRef.current = actor;
    const timer = window.setInterval(() => {
      actor.send({ type: 'TICK' });
      consoleNavigate(
        consoleLiveFallbackHref(
          window.location.pathname,
          window.location.search,
          jobId,
        ),
      );
    }, CONSOLE_LIVE_FALLBACK_MS);
    return () => {
      window.clearInterval(timer);
      actor.send({ type: 'STOP' });
      actor.stop();
    };
  }, [jobId, view.state, succeededHref, live]);

  return (
    <Typography data-testid={ConsoleLiveTestId.StatusSegment}>
      Статус: {formatJobState(view.state)}
      {view.reason ? ` (${formatReason(view.reason)})` : ''}
    </Typography>
  );
};
