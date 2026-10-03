import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class ConsoleSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    if (process.env.CONSOLE_SESSION_REQUIRED === 'false') {
      return true;
    }
    const cookiesBag: unknown =
      'cookies' in req ? (req as { cookies?: unknown }).cookies : undefined;
    const session =
      typeof cookiesBag === 'object' &&
      cookiesBag !== null &&
      'console_session' in cookiesBag
        ? (cookiesBag as { console_session?: unknown }).console_session
        : undefined;
    if (
      (typeof session === 'string' && session) ||
      req.headers.cookie?.includes('console_session=')
    ) {
      return true;
    }
    const loginUrl = process.env.PLATFORM_LOGIN_URL ?? '/login';
    res.redirect(302, loginUrl);
    return false;
  }
}
