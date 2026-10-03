import { ConsoleSessionGuard } from './console-session.guard';
import { ExecutionContext } from '@nestjs/common';

describe('ConsoleSessionGuard', () => {
  const guard = new ConsoleSessionGuard();

  const contextWithCookie = (cookie?: string): ExecutionContext => {
    const redirect = jest.fn();
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: cookie ? { cookie } : {},
        }),
        getResponse: () => ({ redirect }),
      }),
    } as ExecutionContext;
  };

  afterEach(() => {
    delete process.env.CONSOLE_SESSION_REQUIRED;
  });

  it('should_allow_when_session_not_required', () => {
    process.env.CONSOLE_SESSION_REQUIRED = 'false';
    expect(guard.canActivate(contextWithCookie())).toBe(true);
  });

  it('should_redirect_when_session_required_and_cookie_missing', () => {
    process.env.CONSOLE_SESSION_REQUIRED = 'true';
    expect(guard.canActivate(contextWithCookie())).toBe(false);
  });

  it('should_allow_when_console_session_cookie_present', () => {
    process.env.CONSOLE_SESSION_REQUIRED = 'true';
    expect(guard.canActivate(contextWithCookie('console_session=abc'))).toBe(
      true,
    );
  });
});
