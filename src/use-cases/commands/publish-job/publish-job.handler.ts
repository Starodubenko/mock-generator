import { Inject, Injectable } from '@nestjs/common';
import { loadServiceConfig } from '@entities/config/service-config';
import {
  isTerminalJobState,
  transitionJobState,
} from '@entities/job/job.machine';
import {
  OPENSEARCH_INDEX_PORT,
  OpenSearchIndexPort,
} from '@repositories/opensearch-index.port';
import { applyEnumExtras } from '@entities/profile/enum-extras';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';
import { DomainHttpException } from '@app/domain-http.exception';
import { runGeneratePublisher } from '../start-generate/generate-publisher';
import type { JobRecord } from '@entities/job/job.types';

@Injectable()
export class PublishJobHandler {
  private readonly config = loadServiceConfig();
  private readonly batchSize = Number(process.env.PUBLISH_BATCH_SIZE ?? 200);

  constructor(
    @Inject(OPENSEARCH_INDEX_PORT)
    private readonly indexPort: OpenSearchIndexPort,
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    jobId: string,
    input: { targetIndex?: string } = {},
  ): Promise<JobRecord> {
    const job = await this.store.getJob(jobId);
    if (!job) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Задание не найдено',
        '',
      );
    }
    if (job.kind !== 'generate') {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Публиковать можно только генерацию',
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
    if (job.state === 'canary' || job.state === 'running') {
      await this.schedule(job);
      return job;
    }
    if (job.state !== 'preview') {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Сначала дождитесь черновика',
        '',
      );
    }
    if ((await this.store.getDraftDocuments(jobId)).length === 0) {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Черновик ещё не готов',
        '',
      );
    }
    const targetIndex = (
      input.targetIndex !== undefined
        ? input.targetIndex
        : (job.targetIndex ?? '')
    ).trim();
    if (!targetIndex) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Укажите целевой индекс',
        '',
      );
    }
    if (
      this.indexPort.isProdContour(job.contour) ||
      !this.indexPort.isSyntheticIndex(targetIndex)
    ) {
      throw new DomainHttpException(422, 'prod_target', 'Цель запрещена', '');
    }
    const withIndex =
      targetIndex === job.targetIndex ? job : { ...job, targetIndex };
    if (withIndex !== job) {
      await this.store.saveJob(withIndex);
    }
    await this.store.markSyntheticIndex(targetIndex);
    const canary = transitionJobState(withIndex.state, withIndex.kind, {
      type: 'START_CANARY',
    });
    const next = canary ? { ...withIndex, state: canary.state } : withIndex;
    await this.store.saveJob(next);
    await this.schedule(next);
    return next;
  }

  private async schedule(job: JobRecord): Promise<void> {
    if (
      !job.seed ||
      !job.targetIndex ||
      !job.generatedAt ||
      !job.requestedCount ||
      !job.profileVersionId
    ) {
      throw new DomainHttpException(
        422,
        'missing_required',
        'У задания нет данных публикации',
        '',
      );
    }
    const stored = await this.store.getProfile(
      job.documentType,
      job.contour,
      job.profileVersionId,
    );
    if (!stored) {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Версия профиля не найдена',
        '',
      );
    }
    const version = applyEnumExtras(
      stored,
      await this.store.getEnumExtras(
        job.documentType,
        job.contour,
        job.profileVersionId,
      ),
    );
    setImmediate(() => {
      void runGeneratePublisher({
        jobId: job.jobId,
        command: {
          documentType: job.documentType,
          contour: job.contour,
          seed: job.seed as string,
          count: job.requestedCount as number,
          targetIndex: job.targetIndex as string,
          generatedAt: job.generatedAt as string,
          fieldConstraints: job.fieldConstraints,
          arrayPaths: job.arrayPaths,
        },
        version,
        config: this.config,
        indexPort: this.indexPort,
        store: this.store,
        batchSize: this.batchSize,
      });
    });
  }
}
