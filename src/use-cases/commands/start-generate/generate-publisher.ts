import {
  synthesizeDocument,
  deriveDocumentId,
} from '@entities/document/synthesize-document';
import { synthesizeEnvelope } from '@entities/document/synthesize-envelope';
import {
  transitionJobState,
  isTerminalJobState,
} from '@entities/job/job.machine';
import type { FieldConstraint } from '@entities/job/field-constraint';
import type { JobRecord } from '@entities/job/job.types';
import type { ProfileVersion } from '@entities/profile/profile.types';
import type { ServiceConfig } from '@entities/config/service-config';
import { asPlainString } from '@entities/json/as-plain-string';
import { indexDocumentsFromGeneratedBody } from '@entities/profile/parse-corpus-files';
import type { OpenSearchIndexPort } from '@repositories/opensearch-index.port';
import type { ProcessStore } from '@repositories/process-store.port';
import {
  effectiveGoldenValues,
  GOLDEN_UI_MESSAGE_TYPES,
  GOLDEN_UI_STATUSES,
  runGoldenUiChecks,
} from './golden-ui-checks';

export type GeneratePublisherInput = {
  jobId: string;
  command: {
    documentType: string;
    contour: string;
    seed: string;
    count: number;
    targetIndex: string;
    generatedAt: string;
    fieldConstraints?: FieldConstraint[];
    arrayPaths?: string[];
  };
  version: ProfileVersion;
  config: ServiceConfig;
  indexPort: OpenSearchIndexPort;
  store: ProcessStore;
  batchSize: number;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const firstPublishedId = (
  documents: Array<{ id: string; body: Record<string, unknown> }>,
): string | undefined =>
  documents.flatMap((document) =>
    indexDocumentsFromGeneratedBody(document.body, document.id),
  )[0]?.id;

const isForbidden = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  (error as { status: number }).status === 403;

export const prepareGenerateDraft = async (
  input: GeneratePublisherInput,
): Promise<void> => {
  try {
    const zone =
      input.config.allowedContours.find(
        (item) => item.contour === input.command.contour,
      )?.timeZone ?? 'UTC';
    const documents = input.command.arrayPaths?.length
      ? [
          buildEnvelopeDocument(
            input.command,
            input.version,
            input.jobId,
            zone,
          ),
        ]
      : [];
    if (documents.length === 0) {
      for (let number = 1; number <= input.command.count; number += 1) {
        documents.push(
          buildDocument(
            input.command,
            input.version,
            input.jobId,
            number,
            zone,
          ),
        );
      }
    }
    await input.store.saveDraftDocuments(input.jobId, documents);
    const job = await input.store.getJob(input.jobId);
    if (!job || isTerminalJobState(job.state)) {
      return;
    }
    if (job.state === 'accepted') {
      const preview = transitionJobState(job.state, job.kind, {
        type: 'START_PREVIEW',
      });
      if (preview) {
        await input.store.saveJob({ ...job, state: preview.state });
      }
    }
  } catch (error) {
    const reason =
      error instanceof Error && error.message === 'link_outside_job'
        ? 'link_outside_job'
        : 'invariant_exhausted';
    await failJob(input.store, input.jobId, reason);
  }
};

export const runGeneratePublisher = async (
  input: GeneratePublisherInput,
): Promise<void> => {
  try {
    await publishGeneratedDocuments(input);
  } catch (error) {
    const reason =
      error instanceof Error && error.message === 'link_outside_job'
        ? 'link_outside_job'
        : 'invariant_exhausted';
    await failJob(input.store, input.jobId, reason);
  }
};

const documentAt = async (
  store: ProcessStore,
  jobId: string,
  command: GeneratePublisherInput['command'],
  version: ProfileVersion,
  number: number,
  zone: string,
): Promise<{ id: string; body: Record<string, unknown> }> => {
  const drafts = await store.getDraftDocuments(jobId);
  if (command.arrayPaths?.length) {
    if (drafts[0]) {
      return drafts[0];
    }
    return buildEnvelopeDocument(command, version, jobId, zone);
  }
  const draft = drafts[number - 1];
  if (draft) {
    return draft;
  }
  return buildDocument(command, version, jobId, number, zone);
};

const publishGeneratedDocuments = async (
  input: GeneratePublisherInput,
): Promise<void> => {
  const {
    jobId,
    command,
    version,
    config,
    indexPort,
    store,
    batchSize,
  } = input;
  const zone =
    config.allowedContours.find((item) => item.contour === command.contour)
      ?.timeZone ?? 'UTC';
  let job = await store.getJob(jobId);
  if (!job) {
    return;
  }
  const publishUnits = command.arrayPaths?.length ? 1 : command.count;
  const canarySize = Math.min(config.canaryBatchSize, publishUnits);
  const startFrom = job.checkpointDocumentNumber;
  if (startFrom < canarySize && job.state === 'canary') {
    const docs = [];
    for (let n = startFrom + 1; n <= canarySize; n += 1) {
      docs.push(
        await documentAt(store, jobId, command, version, n, zone),
      );
    }
    const canaryOk = await publishBatch({
      indexPort,
      store,
      job,
      command,
      batchNo: 1,
      mode: 'canary',
      documents: docs,
      config,
    });
    if (!canaryOk) {
      return;
    }
    await indexPort.refresh({
      contour: command.contour,
      index: command.targetIndex,
    });
    if (
      !(await runGoldenUiChecks(
        indexPort,
        command.contour,
        command.targetIndex,
        command.generatedAt,
        zone,
        command.count,
        firstPublishedId(docs),
        command.fieldConstraints,
      ))
    ) {
      await failJob(store, jobId, 'canary_failed');
      return;
    }
    job = await store.getJob(jobId);
    if (!job) {
      return;
    }
    const running = transitionJobState(job.state, job.kind, {
      type: 'START_RUNNING',
    });
    if (running) {
      await store.saveJob({
        ...job,
        state: running.state,
        checkpointDocumentNumber: canarySize,
        publishedCount: canarySize,
      });
    }
  }
  job = await store.getJob(jobId);
  if (!job || job.state !== 'running') {
    return;
  }
  let nextDoc = job.checkpointDocumentNumber + 1;
  let batchNo = Math.max(
    2,
    Math.floor(job.checkpointDocumentNumber / batchSize) + 1,
  );
  while (nextDoc <= publishUnits) {
    job = await store.getJob(jobId);
    if (!job || isTerminalJobState(job.state)) {
      return;
    }
    const batchDocs = [];
    const batchEnd = Math.min(nextDoc + batchSize - 1, publishUnits);
    for (let n = nextDoc; n <= batchEnd; n += 1) {
      batchDocs.push(
        await documentAt(store, jobId, command, version, n, zone),
      );
    }
    const fullOk = await publishBatch({
      indexPort,
      store,
      job,
      command,
      batchNo,
      mode: 'full',
      documents: batchDocs,
      config,
    });
    if (!fullOk) {
      return;
    }
    job = await store.getJob(jobId);
    if (!job) {
      return;
    }
    await store.saveJob({
      ...job,
      checkpointDocumentNumber: batchEnd,
      publishedCount: batchEnd,
    });
    nextDoc = batchEnd + 1;
    batchNo += 1;
  }
  await indexPort.refresh({
    contour: command.contour,
    index: command.targetIndex,
  });
  const firstDraft = await documentAt(
    store,
    jobId,
    command,
    version,
    1,
    zone,
  );
  if (
    !(await runGoldenUiChecks(
      indexPort,
      command.contour,
      command.targetIndex,
      command.generatedAt,
      zone,
      command.count,
      firstPublishedId([firstDraft]) ?? deriveDocumentId(jobId, 1),
      command.fieldConstraints,
    ))
  ) {
    await failJob(store, jobId, 'canary_failed');
    return;
  }
  job = await store.getJob(jobId);
  if (!job) {
    return;
  }
  const succeed = transitionJobState(job.state, job.kind, { type: 'SUCCEED' });
  if (succeed) {
    await store.saveJob({
      ...job,
      state: succeed.state,
      publishedCount: command.count,
      finishedAt: new Date().toISOString(),
    });
  }
};

const buildDocument = (
  command: GeneratePublisherInput['command'],
  version: ProfileVersion,
  jobId: string,
  number: number,
  zone: string,
): { id: string; body: Record<string, unknown> } => {
  let body = synthesizeDocument({
    version,
    seed: command.seed,
    jobId,
    number,
    generatedAt: command.generatedAt,
    zone,
    constraints: command.fieldConstraints,
  });
  const hasPath = (path: string): boolean =>
    version.paths.some((item) => item.path === path);
  const statuses = effectiveGoldenValues(
    GOLDEN_UI_STATUSES,
    command.fieldConstraints,
    'status',
  );
  if (hasPath('status') && number <= statuses.length) {
    body = { ...body, status: statuses[number - 1] };
  }
  const messageTypes = effectiveGoldenValues(
    GOLDEN_UI_MESSAGE_TYPES,
    command.fieldConstraints,
    'messageType',
  );
  if (hasPath('messageType') && number <= messageTypes.length) {
    body = { ...body, messageType: messageTypes[number - 1] };
  }
  return { id: asPlainString(body.id, `${jobId}-${number}`), body };
};

const buildEnvelopeDocument = (
  command: GeneratePublisherInput['command'],
  version: ProfileVersion,
  jobId: string,
  zone: string,
): { id: string; body: Record<string, unknown> } => {
  const body = synthesizeEnvelope({
    version,
    seed: command.seed,
    jobId,
    number: 1,
    generatedAt: command.generatedAt,
    zone,
    constraints: command.fieldConstraints,
    count: command.count,
    arrayPaths: command.arrayPaths ?? [],
  });
  return { id: asPlainString(body.id, `${jobId}-1`), body };
};

const failJob = async (
  store: ProcessStore,
  jobId: string,
  reason:
    | 'canary_failed'
    | 'poison_ratio'
    | 'prod_target'
    | 'invariant_exhausted'
    | 'link_outside_job',
): Promise<void> => {
  const job = await store.getJob(jobId);
  if (!job) {
    return;
  }
  const failed = transitionJobState(job.state, job.kind, {
    type: 'FAIL',
    reason,
  });
  if (failed) {
    await store.saveJob({
      ...job,
      state: failed.state,
      reason: failed.reason,
      finishedAt: new Date().toISOString(),
    });
  }
};

const publishBatch = async (args: {
  indexPort: OpenSearchIndexPort;
  store: ProcessStore;
  job: JobRecord;
  command: GeneratePublisherInput['command'];
  batchNo: number;
  mode: 'canary' | 'full';
  documents: Array<{ id: string; body: Record<string, unknown> }>;
  config: ServiceConfig;
}): Promise<boolean> => {
  const { indexPort, store, job, command, batchNo, mode, documents, config } =
    args;
  const indexed = documents.flatMap((document) =>
    indexDocumentsFromGeneratedBody(document.body, document.id),
  );
  let result;
  try {
    result = await indexPort.upsertBatch({
      contour: command.contour,
      index: command.targetIndex,
      jobId: job.jobId,
      batchNo,
      mode,
      documents: indexed,
    });
    while (result.retryAfterMs) {
      await sleep(result.retryAfterMs);
      result = await indexPort.upsertBatch({
        contour: command.contour,
        index: command.targetIndex,
        jobId: job.jobId,
        batchNo,
        mode,
        documents: indexed,
      });
    }
  } catch (error) {
    if (isForbidden(error)) {
      await failJob(store, job.jobId, 'prod_target');
      return false;
    }
    throw error;
  }
  if (result.rejected.length > 0) {
    await store.appendQuarantine(
      job.jobId,
      result.rejected.map((item) => ({
        documentId: item.id,
        reason: item.reason,
      })),
    );
    const ratio = result.rejected.length / indexed.length;
    if (mode === 'canary' || ratio >= config.poisonRatioThreshold) {
      if (mode === 'canary') {
        await indexPort.purgeJobDocuments({
          contour: command.contour,
          index: command.targetIndex,
          jobId: job.jobId,
        });
      }
      await failJob(
        store,
        job.jobId,
        mode === 'canary' ? 'canary_failed' : 'poison_ratio',
      );
      return false;
    }
  }
  await store.appendPublishedIds(job.jobId, result.accepted);
  const jobRow = await store.getJob(job.jobId);
  if (jobRow) {
    await store.saveJob({
      ...jobRow,
      quarantineCount: (await store.getQuarantine(job.jobId)).length,
    });
  }
  return true;
};
