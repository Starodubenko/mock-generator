import { ExecutionContext } from '@nestjs/common';
import { ApiBearerGuard } from './api-bearer.guard';
import { DomainHttpException } from '@app/domain-http.exception';

describe('ApiBearerGuard', () => {
  const guard = new ApiBearerGuard();
  const originalToken = process.env.PLATFORM_SERVICE_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.PLATFORM_SERVICE_TOKEN;
    } else {
      process.env.PLATFORM_SERVICE_TOKEN = originalToken;
    }
  });

  const ctx = (url: string, authorization?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          headers: authorization ? { authorization } : {},
        }),
      }),
    }) as ExecutionContext;

  it('should_allow_health_without_token', () => {
    expect(guard.canActivate(ctx('/api/v1/health'))).toBe(true);
  });

  it('should_reject_protected_route_without_bearer', () => {
    delete process.env.PLATFORM_SERVICE_TOKEN;
    expect(() => guard.canActivate(ctx('/api/v1/jobs'))).toThrow(
      DomainHttpException,
    );
  });

  it('should_allow_any_bearer_when_platform_token_unset', () => {
    delete process.env.PLATFORM_SERVICE_TOKEN;
    expect(guard.canActivate(ctx('/api/v1/jobs', 'Bearer dev'))).toBe(true);
  });

  it('should_allow_when_bearer_matches', () => {
    process.env.PLATFORM_SERVICE_TOKEN = 'secret';
    expect(guard.canActivate(ctx('/api/v1/jobs', 'Bearer secret'))).toBe(true);
  });
});
