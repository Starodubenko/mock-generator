import { Inject, Injectable } from '@nestjs/common';
import type { JobRecord } from '@entities/job/job.types';
import { sortJobsByCreatedAt } from '@entities/job/sort-jobs';
import {
  JobListFilter,
  PROCESS_STORE,
  ProcessStore,
} from '@repositories/process-store.port';

@Injectable()
export class ListJobsHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    filter: JobListFilter,
  ): Promise<{ items: JobRecord[]; nextCursor: null }> {
    return {
      items: sortJobsByCreatedAt(await this.store.listJobs(filter)),
      nextCursor: null,
    };
  }
}
