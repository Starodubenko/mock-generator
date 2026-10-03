import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { loadIndexerConfig } from '../config';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const config = loadIndexerConfig();
    const req = context.switchToHttp().getRequest<Request>();
    const serviceName = String(req.headers['x-service-name'] ?? '');
    if (serviceName !== config.serviceName) {
      throw new UnauthorizedException({ reason: 'missing_required', message: 'X-Service-Name' });
    }
    if (!config.platformToken) {
      return true;
    }
    const expected = `Bearer ${config.platformToken}`;
    if (req.headers.authorization !== expected) {
      throw new UnauthorizedException({ reason: 'missing_required', message: 'Authorization' });
    }
    return true;
  }
}
