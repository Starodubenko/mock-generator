import { canAcceptConsoleLiveUpgrade } from './can-accept-console-live-upgrade';

describe('canAcceptConsoleLiveUpgrade', () => {
  it('should_allow_when_session_is_not_required', () => {
    expect(canAcceptConsoleLiveUpgrade(undefined, false)).toBe(true);
  });

  it('should_require_console_session_cookie', () => {
    expect(canAcceptConsoleLiveUpgrade('other=1', true)).toBe(false);
    expect(canAcceptConsoleLiveUpgrade('console_session=abc', true)).toBe(true);
  });
});
