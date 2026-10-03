import { ConsoleLiveChannel } from '@frontend/entities/console-live/console-live.contract';

export const buildConsoleLiveUrl = (location: {
  protocol: string;
  host: string;
}): string => {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}${ConsoleLiveChannel.Path}`;
};
