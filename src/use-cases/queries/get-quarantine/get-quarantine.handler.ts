import { Inject, Injectable } from '@nestjs/common';
import {
  PROCESS_STORE,
  ProcessStore,
  QuarantineItem,
} from '@repositories/process-store.port';
import { GetJobHandler } from '../get-job/get-job.handler';

@Injectable()
export class GetQuarantineHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
    private readonly getJob: GetJobHandler,
  ) {}

  async execute(
    jobId: string,
  ): Promise<{ jobId: string; total: number; items: QuarantineItem[] }> {
    await this.getJob.execute(jobId);
    const items = await this.store.getQuarantine(jobId);
    return { jobId, total: items.length, items };
  }
}
