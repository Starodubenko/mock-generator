import { isTerminalConsoleLiveState } from '@frontend/entities/console-live/console-live.contract';

export const isTerminalJobState = (state: string): boolean =>
  isTerminalConsoleLiveState(state);
