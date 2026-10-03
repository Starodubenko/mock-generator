import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import type { JobRecord } from '@entities/job/job.types';
import {
  isTerminalJobState,
  transitionJobState,
} from '@entities/job/job.machine';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

@Injectable()
export class CancelJobHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(jobId: string): Promise<JobRecord> {
    const job = await this.store.getJob(jobId);
    if (!job) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Задание не найдено',
        '',
      );
    }
    if (isTerminalJobState(job.state)) {
      throw new DomainHttpException(
        409,
        'idempotency_conflict',
        'Задание уже завершено',
        '',
      );
    }
    const cancelled = transitionJobState(job.state, job.kind, {
      type: 'CANCEL',
    });
    if (!cancelled) {
      throw new DomainHttpException(
        409,
        'idempotency_conflict',
        'Отмена недоступна',
        '',
      );
    }
    const updated: JobRecord = {
      ...job,
      state: cancelled.state,
      finishedAt: new Date().toISOString(),
    };
    await this.store.saveJob(updated);
    return updated;
  }
}
