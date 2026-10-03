import { HttpException } from '@nestjs/common';
import type { FailReason } from '@entities/job/fail-reason';

export class DomainHttpException extends HttpException {
  constructor(
    status: number,
    reason:
      | FailReason
      | 'validation_error'
      | 'mock_group_exists'
      | 'mock_endpoint_exists'
      | 'array_path_invalid',
    detail: string,
    instance: string,
  ) {
    super(
      {
        type: 'about:blank',
        title: detail,
        status,
        detail,
        reason,
        instance,
      },
      status,
    );
  }
}
