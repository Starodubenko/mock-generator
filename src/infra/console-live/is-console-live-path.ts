import { isConsoleLiveChannelPath } from '@entities/console-live/console-live.contract';

export const isConsoleLivePath = (url: string): boolean => {
  const path = url.split('?')[0] ?? url;
  return isConsoleLiveChannelPath(path);
};
