import { ConsoleLiveChannel } from '@entities/console-live/console-live.contract';
import { isConsoleLivePath } from './is-console-live-path';

describe('isConsoleLivePath', () => {
  it('should_match_console_live_and_ignore_query', () => {
    expect(isConsoleLivePath(ConsoleLiveChannel.Path)).toBe(true);
    expect(isConsoleLivePath(`${ConsoleLiveChannel.Path}?x=1`)).toBe(true);
    expect(isConsoleLivePath('/@vite/client')).toBe(false);
    expect(isConsoleLivePath('/jobs/1')).toBe(false);
  });
});
