import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import type { JobRecord } from '@entities/job/job.types';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

@Injectable()
export class GetJobHandler {
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
    return job;
  }
}
