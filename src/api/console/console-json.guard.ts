import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ConsoleJsonGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const accept = request.headers.accept ?? '';
    const wantsJson =
      accept.includes('application/json') && !accept.includes('text/html');
    if (wantsJson) {
      throw new NotAcceptableException('Пульт отдаёт только HTML');
    }
    return true;
  }
}
