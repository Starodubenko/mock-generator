import { HttpException, HttpStatus } from '@nestjs/common';

export class IndexerForbiddenError extends HttpException {
  constructor(reason: string) {
    super({ reason, message: reason }, HttpStatus.FORBIDDEN);
  }
}

export class IndexerThrottleError extends HttpException {
  constructor(retryAfterMs: number) {
    super({ accepted: [], rejected: [], retryAfterMs }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class IndexerNotFoundError extends HttpException {
  constructor(reason = 'missing_required') {
    super({ reason, message: reason }, HttpStatus.NOT_FOUND);
  }
}
