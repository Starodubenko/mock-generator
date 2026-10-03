import { Inject, Injectable } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { buildProfile } from '@entities/profile/build-profile';
import {
  isContourAllowed,
  loadServiceConfig,
} from '@entities/config/service-config';
import type { FailReason } from '@entities/job/fail-reason';
import type { JobRecord } from '@entities/job/job.types';
import { transitionJobState } from '@entities/job/job.machine';
import {
  OPENSEARCH_INDEX_PORT,
  OpenSearchIndexPort,
} from '@repositories/opensearch-index.port';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';
import { DomainHttpException } from '@app/domain-http.exception';

export type StartTrainingCommand = {
  documentType: string;
  contour: string;
  documents: Record<string, unknown>[];
  sampleSize: number;
  aliases: Array<{ from: string; to: string }>;
  idempotencyKey: string;
  bodyHash: string;
};

export type StartJobResult = {
  job: JobRecord;
  replayed: boolean;
};

@Injectable()
export class StartTrainingHandler {
  private readonly config = loadServiceConfig();

  constructor(
    @Inject(OPENSEARCH_INDEX_PORT)
    private readonly indexPort: OpenSearchIndexPort,
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(command: StartTrainingCommand): Promise<StartJobResult> {
    const enabled = this.config.enabledDocumentTypes.find(
      (item) => item.documentType === command.documentType,
    );
    if (
      !(await this.store.hasDocumentType(command.documentType)) &&
      !enabled?.enabled
    ) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Тип документа не найден',
        '',
      );
    }
    if (
      this.config.allowedContours.length === 0 ||
      !isContourAllowed(this.config, command.contour)
    ) {
      throw new DomainHttpException(
        422,
        'prod_target',
        'Контур не в allow-list',
        '',
      );
    }
    if (command.documents.length === 0) {
      throw new DomainHttpException(
        422,
        'empty_corpus',
        'Эталонные файлы не приложены',
        '',
      );
    }
    const existingKey = await this.store.getIdempotency(command.idempotencyKey);
    if (existingKey) {
      if (existingKey.bodyHash !== command.bodyHash) {
        throw new DomainHttpException(
          409,
          'idempotency_conflict',
          'Конфликт идемпотентности',
          '',
        );
      }
      const existingJob = await this.store.getJob(existingKey.jobId);
      if (existingJob) {
        return { job: existingJob, replayed: true };
      }
    }
    const inFlightKey = `${command.documentType}:${command.contour}`;
    if (await this.store.hasTrainingInFlight(inFlightKey)) {
      throw new DomainHttpException(
        409,
        'idempotency_conflict',
        'Обучение уже идёт',
        '',
      );
    }
    const parallelTrain = (
      await this.store.listJobs({
        documentType: command.documentType,
        contour: command.contour,
        kind: 'train',
      })
    ).some((job) => job.state === 'accepted' || job.state === 'profiling');
    if (parallelTrain) {
      throw new DomainHttpException(
        409,
        'idempotency_conflict',
        'Обучение уже идёт',
        '',
      );
    }
    const jobId = randomUUID();
    let job: JobRecord = {
      jobId,
      kind: 'train',
      documentType: command.documentType,
      contour: command.contour,
      state: 'accepted',
      profileVersionId: null,
      seed: null,
      requestedCount: command.sampleSize,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: null,
      generatedAt: null,
    };
    await this.store.saveJob(job);
    await this.store.saveIdempotency({
      key: command.idempotencyKey,
      bodyHash: command.bodyHash,
      jobId,
    });
    await this.store.setTrainingInFlight(inFlightKey, jobId);
    const profiling = transitionJobState(job.state, job.kind, {
      type: 'START_PROFILING',
    });
    if (profiling) {
      job = { ...job, state: profiling.state };
      await this.store.saveJob(job);
    }
    setImmediate(() => {
      void this.runTraining(jobId, command);
    });
    return { job, replayed: false };
  }

  private async runTraining(
    jobId: string,
    command: StartTrainingCommand,
  ): Promise<void> {
    const inFlightKey = `${command.documentType}:${command.contour}`;
    const failJob = async (reason: FailReason): Promise<void> => {
      const job = await this.store.getJob(jobId);
      if (!job) {
        return;
      }
      const failed = transitionJobState(job.state, job.kind, {
        type: 'FAIL',
        reason,
      });
      if (failed) {
        await this.store.saveJob({
          ...job,
          state: failed.state,
          reason: failed.reason,
          finishedAt: new Date().toISOString(),
        });
      }
    };
    try {
      const documents = command.documents.slice(0, command.sampleSize);
      const mappingIndex = `${command.documentType}-synthetic`;
      const mapping = await this.indexPort.getMapping({
        contour: command.contour,
        index: mappingIndex,
      });
      const built = buildProfile({
        documentType: command.documentType,
        contour: command.contour,
        snapshotId: `upload:${jobId}`,
        mappingIndex,
        aliases: command.aliases,
        documents,
        minSampleSize: this.config.minSampleSize,
        createdAt: new Date().toISOString(),
        maxCategoryCardinality: this.config.maxCategoryCardinality,
        mapping,
      });
      const job = await this.store.getJob(jobId);
      if (!job) {
        return;
      }
      if (!built.ok) {
        await failJob(built.reason);
        return;
      }
      await this.store.saveProfile(built.version);
      const ready = transitionJobState(job.state, job.kind, {
        type: 'PROFILE_READY',
      });
      if (ready) {
        await this.store.saveJob({
          ...job,
          state: ready.state,
          profileVersionId: built.version.versionId,
        });
      }
      const current = await this.store.getJob(jobId);
      if (!current) {
        return;
      }
      const done = transitionJobState(current.state, current.kind, {
        type: 'SUCCEED',
      });
      if (done) {
        await this.store.saveJob({
          ...current,
          state: done.state,
          finishedAt: new Date().toISOString(),
        });
      }
    } catch {
      await failJob('transport_rejected');
    } finally {
      await this.store.clearTrainingInFlight(inFlightKey);
    }
  }
}

export const hashBody = (body: unknown): string =>
  createHash('sha256').update(JSON.stringify(body)).digest('hex');
