import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (response.headersSent) {
      return;
    }
    if (!request.url.startsWith('/api/v1')) {
      if (exception instanceof HttpException) {
        response.status(exception.getStatus()).json(exception.getResponse());
        return;
      }
      response.status(500).send('Internal Server Error');
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'reason' in payload
      ) {
        response.status(status).type('application/problem+json').json(payload);
        return;
      }
      response
        .status(status)
        .type('application/problem+json')
        .json({
          type: 'about:blank',
          title: 'Request failed',
          status,
          detail:
            typeof payload === 'string' ? payload : JSON.stringify(payload),
          reason: status === 400 ? 'validation_error' : 'transport_rejected',
          instance: request.url,
        });
      return;
    }
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title: 'Internal error',
        status: 500,
        detail: 'Unexpected error',
        reason: 'transport_rejected',
        instance: request.url,
      });
  }
}
