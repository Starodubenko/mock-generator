import { ConsoleLiveChannel } from '@frontend/entities/console-live/console-live.contract';
import { buildConsoleLiveUrl } from './build-console-live-url';

describe('buildConsoleLiveUrl', () => {
  it('should_use_contract_path_and_ws_scheme', () => {
    expect(
      buildConsoleLiveUrl({ protocol: 'http:', host: '127.0.0.1:3000' }),
    ).toBe(`ws://127.0.0.1:3000${ConsoleLiveChannel.Path}`);
    expect(
      buildConsoleLiveUrl({ protocol: 'https:', host: 'console.test' }),
    ).toBe(`wss://console.test${ConsoleLiveChannel.Path}`);
  });
});
