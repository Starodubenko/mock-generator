import { Inject, Injectable } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { formatGeneratedAt } from '@entities/config/calendar-day';
import {
  isContourAllowed,
  loadServiceConfig,
} from '@entities/config/service-config';
import type { FieldConstraint } from '@entities/job/field-constraint';
import { normalizeFieldConstraints } from '@entities/job/field-constraint';
import { validateFieldConstraints } from '@entities/job/validate-field-constraints';
import {
  normalizeArrayPaths,
  validateArrayPaths,
} from '@entities/job/array-paths';
import type { JobRecord } from '@entities/job/job.types';
import {
  OPENSEARCH_INDEX_PORT,
  OpenSearchIndexPort,
} from '@repositories/opensearch-index.port';
import { applyEnumExtras } from '@entities/profile/enum-extras';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';
import { DomainHttpException } from '@app/domain-http.exception';
import {
  prepareGenerateDraft,
  runGeneratePublisher,
} from './generate-publisher';
import type { StartJobResult } from '../start-training/start-training.handler';

export type StartGenerateCommand = {
  documentType: string;
  contour: string;
  profileVersionId?: string;
  seed: string;
  count: number;
  targetIndex: string;
  generatedAt?: string;
  idempotencyKey: string;
  bodyHash: string;
  jobId?: string;
  fieldConstraints?: FieldConstraint[];
  arrayPaths?: string[];
};

@Injectable()
export class StartGenerateHandler {
  private readonly config = loadServiceConfig();
  private readonly batchSize = Number(process.env.PUBLISH_BATCH_SIZE ?? 200);

  constructor(
    @Inject(OPENSEARCH_INDEX_PORT)
    private readonly indexPort: OpenSearchIndexPort,
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(command: StartGenerateCommand): Promise<StartJobResult> {
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
    if (
      this.indexPort.isProdContour(command.contour) ||
      !this.indexPort.isSyntheticIndex(command.targetIndex)
    ) {
      throw new DomainHttpException(422, 'prod_target', 'Цель запрещена', '');
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
    const versionId =
      command.profileVersionId ??
      (await this.store.getActiveVersionId(
        command.documentType,
        command.contour,
      ));
    if (!versionId) {
      throw new DomainHttpException(
        422,
        'missing_required',
        'Нет рабочей версии профиля',
        '',
      );
    }
    const stored = await this.store.getProfile(
      command.documentType,
      command.contour,
      versionId,
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
        command.documentType,
        command.contour,
        versionId,
      ),
    );
    const zone =
      this.config.allowedContours.find(
        (item) => item.contour === command.contour,
      )?.timeZone ?? 'UTC';
    const generatedAt = command.generatedAt?.trim()
      ? command.generatedAt
      : formatGeneratedAt(new Date(), zone);
    const checked = validateFieldConstraints(
      command.fieldConstraints,
      version,
      generatedAt,
      zone,
    );
    if (!checked.ok) {
      throw new DomainHttpException(
        400,
        'validation_error',
        'Некорректные ограничения полей пачки',
        '',
      );
    }
    const fieldConstraints =
      checked.constraints.length > 0 ? checked.constraints : undefined;
    const arrayPaths = normalizeArrayPaths(command.arrayPaths);
    if (!validateArrayPaths(arrayPaths, version).ok) {
      throw new DomainHttpException(
        400,
        'array_path_invalid',
        'Путь должен быть массивом из схемы профиля',
        '',
      );
    }
    const nextCommand = {
      ...command,
      generatedAt,
      fieldConstraints,
      arrayPaths: arrayPaths.length > 0 ? arrayPaths : undefined,
    };
    if (command.jobId) {
      const resumed = await this.store.getJob(command.jobId);
      if (resumed) {
        if (resumed.state === 'canary' || resumed.state === 'running') {
          this.schedulePublish(command.jobId, nextCommand, version);
        } else if (resumed.state === 'accepted') {
          this.scheduleDraft(command.jobId, nextCommand, version);
        }
        return { job: resumed, replayed: true };
      }
    }
    const jobId = command.jobId ?? randomUUID();
    const job: JobRecord = {
      jobId,
      kind: 'generate',
      documentType: command.documentType,
      contour: command.contour,
      state: 'accepted',
      profileVersionId: versionId,
      seed: command.seed,
      requestedCount: command.count,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: command.targetIndex,
      generatedAt,
      fieldConstraints,
      arrayPaths: nextCommand.arrayPaths,
    };
    await this.store.saveJob(job);
    await this.store.saveIdempotency({
      key: command.idempotencyKey,
      bodyHash: command.bodyHash,
      jobId,
    });
    await this.store.markSyntheticIndex(command.targetIndex);
    this.scheduleDraft(jobId, nextCommand, version);
    return { job, replayed: false };
  }

  private async publisherInput(
    jobId: string,
    command: StartGenerateCommand,
    version: NonNullable<Awaited<ReturnType<ProcessStore['getProfile']>>>,
  ) {
    const storedJob = await this.store.getJob(jobId);
    return {
      jobId,
      command: {
        ...command,
        generatedAt: command.generatedAt as string,
        fieldConstraints:
          command.fieldConstraints ?? storedJob?.fieldConstraints,
        arrayPaths: command.arrayPaths ?? storedJob?.arrayPaths,
      },
      version,
      config: this.config,
      indexPort: this.indexPort,
      store: this.store,
      batchSize: this.batchSize,
    };
  }

  private scheduleDraft(
    jobId: string,
    command: StartGenerateCommand,
    version: NonNullable<Awaited<ReturnType<ProcessStore['getProfile']>>>,
  ): void {
    setImmediate(() => {
      void this.publisherInput(jobId, command, version).then(
        prepareGenerateDraft,
      );
    });
  }

  private schedulePublish(
    jobId: string,
    command: StartGenerateCommand,
    version: NonNullable<Awaited<ReturnType<ProcessStore['getProfile']>>>,
  ): void {
    setImmediate(() => {
      void this.publisherInput(jobId, command, version).then(
        runGeneratePublisher,
      );
    });
  }
}

export const hashGenerateBody = (body: unknown): string => {
  const record = { ...(body as Record<string, unknown>) };
  const normalized = normalizeFieldConstraints(
    record.fieldConstraints as FieldConstraint[] | undefined,
  );
  if (normalized.length > 0) {
    record.fieldConstraints = normalized;
  } else {
    delete record.fieldConstraints;
  }
  if (!record.generatedAt) {
    delete record.generatedAt;
  }
  const arrayPaths = normalizeArrayPaths(record.arrayPaths);
  if (arrayPaths.length > 0) {
    record.arrayPaths = arrayPaths;
  } else {
    delete record.arrayPaths;
  }
  return createHash('sha256').update(JSON.stringify(record)).digest('hex');
};
