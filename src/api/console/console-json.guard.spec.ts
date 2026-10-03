import { ExecutionContext, NotAcceptableException } from '@nestjs/common';
import { ConsoleJsonGuard } from './console-json.guard';

describe('ConsoleJsonGuard', () => {
  const guard = new ConsoleJsonGuard();

  const ctx = (accept?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: accept ? { accept } : {},
        }),
      }),
    }) as ExecutionContext;

  it('should_allow_html_accept', () => {
    expect(guard.canActivate(ctx('text/html'))).toBe(true);
  });

  it('should_reject_json_accept_with_406', () => {
    expect(() => guard.canActivate(ctx('application/json'))).toThrow(
      NotAcceptableException,
    );
  });
});
