import { Injectable } from '@nestjs/common';
import type { JobRecord } from '@entities/job/job.types';
import type { JobListFilter } from '@repositories/process-store.port';
import { NeighborRpc } from '../../shared/neighbor-rpc';

@Injectable()
export class NeighborJobRepository {
  constructor(private readonly rpc: NeighborRpc) {}

  async getJob(jobId: string): Promise<JobRecord | undefined> {
    const result = await this.rpc.call<JobRecord | null>('getJob', { jobId });
    return result ?? undefined;
  }

  async saveJob(job: JobRecord): Promise<void> {
    await this.rpc.call('saveJob', { job });
  }

  async listJobs(filter: JobListFilter): Promise<JobRecord[]> {
    return this.rpc.call<JobRecord[]>('listJobs', { filter });
  }
}
