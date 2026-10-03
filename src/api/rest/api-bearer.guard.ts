import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { DomainHttpException } from '@app/domain-http.exception';

@Injectable()
export class ApiBearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url.split('?')[0] ?? '';
    if (!path.startsWith('/api/v1') || path === '/api/v1/health') {
      return true;
    }
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ') || header.length <= 7) {
      throw new DomainHttpException(
        401,
        'transport_rejected',
        'Нужен заголовок Authorization: Bearer',
        path,
      );
    }
    const expected = process.env.PLATFORM_SERVICE_TOKEN;
    if (expected && header !== `Bearer ${expected}`) {
      throw new DomainHttpException(
        401,
        'transport_rejected',
        'Неверный Bearer-токен',
        path,
      );
    }
    return true;
  }
}
