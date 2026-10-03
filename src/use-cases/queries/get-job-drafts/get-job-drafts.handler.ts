import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  PROCESS_STORE,
  ProcessStore,
  type DraftDocument,
} from '@repositories/process-store.port';

@Injectable()
export class GetJobDraftsHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(jobId: string): Promise<DraftDocument[]> {
    const job = await this.store.getJob(jobId);
    if (!job) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Задание не найдено',
        '',
      );
    }
    return this.store.getDraftDocuments(jobId);
  }
}
