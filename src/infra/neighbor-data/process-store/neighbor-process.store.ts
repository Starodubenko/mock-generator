import { Inject, Injectable, Optional } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import type { JobRecord } from '@entities/job/job.types';
import type { ProfileVersion } from '@entities/profile/profile.types';
import { CONSOLE_LIVE, ConsoleLivePort } from '@repositories/console-live.port';
import {
  ActivationRecord,
  DocumentTypeRecord,
  DraftDocument,
  IdempotencyRecord,
  JobListFilter,
  ProcessStore,
  QuarantineItem,
} from '@repositories/process-store.port';
import { emitJobChanged } from '../../console-live/emit-job-changed';
import { NeighborActivationRepository } from './activation/neighbor-activation.repository';
import { NeighborDocumentTypeRepository } from './document-type/neighbor-document-type.repository';
import { NeighborDraftRepository } from './draft/neighbor-draft.repository';
import { NeighborEnumExtraRepository } from './enum-extra/neighbor-enum-extra.repository';
import { NeighborHttp } from '../shared/neighbor-http';
import { NeighborIdempotencyRepository } from './idempotency/neighbor-idempotency.repository';
import { NeighborJobRepository } from './job/neighbor-job.repository';
import { NeighborProfileRepository } from './profile/neighbor-profile.repository';
import { NeighborPublishedIdRepository } from './published-id/neighbor-published-id.repository';
import { NeighborQuarantineRepository } from './quarantine/neighbor-quarantine.repository';
import { NeighborRpc } from '../shared/neighbor-rpc';
import { NeighborSyntheticMarkRepository } from './synthetic-mark/neighbor-synthetic-mark.repository';
import { NeighborTrainingInFlightRepository } from './training-in-flight/neighbor-training-in-flight.repository';
import { NeighborVersionLabelRepository } from './version-label/neighbor-version-label.repository';

export const createNeighborProcessStore = (
  http: HttpService,
  live?: ConsoleLivePort,
): NeighborProcessStore => {
  const rpc = new NeighborRpc(new NeighborHttp(http));
  return new NeighborProcessStore(
    new NeighborJobRepository(rpc),
    new NeighborTrainingInFlightRepository(rpc),
    new NeighborIdempotencyRepository(rpc),
    new NeighborProfileRepository(rpc),
    new NeighborEnumExtraRepository(rpc),
    new NeighborVersionLabelRepository(rpc),
    new NeighborActivationRepository(rpc),
    new NeighborQuarantineRepository(rpc),
    new NeighborSyntheticMarkRepository(rpc),
    new NeighborPublishedIdRepository(rpc),
    new NeighborDraftRepository(rpc),
    new NeighborDocumentTypeRepository(rpc),
    live,
  );
};

@Injectable()
export class NeighborProcessStore extends ProcessStore {
  constructor(
    private readonly jobs: NeighborJobRepository,
    private readonly training: NeighborTrainingInFlightRepository,
    private readonly idempotency: NeighborIdempotencyRepository,
    private readonly profiles: NeighborProfileRepository,
    private readonly enumExtras: NeighborEnumExtraRepository,
    private readonly versionLabels: NeighborVersionLabelRepository,
    private readonly activations: NeighborActivationRepository,
    private readonly quarantine: NeighborQuarantineRepository,
    private readonly syntheticMarks: NeighborSyntheticMarkRepository,
    private readonly publishedIds: NeighborPublishedIdRepository,
    private readonly drafts: NeighborDraftRepository,
    private readonly documentTypes: NeighborDocumentTypeRepository,
    @Optional()
    @Inject(CONSOLE_LIVE)
    private readonly live?: ConsoleLivePort,
  ) {
    super();
  }

  async getJob(jobId: string): Promise<JobRecord | undefined> {
    return this.jobs.getJob(jobId);
  }

  async saveJob(job: JobRecord): Promise<void> {
    await this.jobs.saveJob(job);
    await emitJobChanged(this.live, this, job);
  }

  async listJobs(filter: JobListFilter): Promise<JobRecord[]> {
    return this.jobs.listJobs(filter);
  }

  async hasTrainingInFlight(key: string): Promise<boolean> {
    return this.training.hasTrainingInFlight(key);
  }

  async setTrainingInFlight(key: string, jobId: string): Promise<void> {
    await this.training.setTrainingInFlight(key, jobId);
  }

  async clearTrainingInFlight(key: string): Promise<void> {
    await this.training.clearTrainingInFlight(key);
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | undefined> {
    return this.idempotency.getIdempotency(key);
  }

  async saveIdempotency(record: IdempotencyRecord): Promise<void> {
    await this.idempotency.saveIdempotency(record);
  }

  async getProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<ProfileVersion | undefined> {
    return this.profiles.getProfile(documentType, contour, versionId);
  }

  async saveProfile(version: ProfileVersion): Promise<void> {
    await this.profiles.saveProfile(version);
  }

  async getEnumExtras(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<Record<string, string[]>> {
    return this.enumExtras.getEnumExtras(documentType, contour, versionId);
  }

  async addEnumExtra(
    documentType: string,
    contour: string,
    versionId: string,
    path: string,
    value: string,
  ): Promise<void> {
    await this.enumExtras.addEnumExtra(
      documentType,
      contour,
      versionId,
      path,
      value,
    );
  }

  async listProfiles(
    documentType: string,
    contour: string,
  ): Promise<ProfileVersion[]> {
    return this.profiles.listProfiles(documentType, contour);
  }

  async deleteProfile(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void> {
    await this.profiles.deleteProfile(documentType, contour, versionId);
  }

  async getVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<string | undefined> {
    return this.versionLabels.getVersionLabel(documentType, contour, versionId);
  }

  async setVersionLabel(
    documentType: string,
    contour: string,
    versionId: string,
    label: string,
  ): Promise<void> {
    await this.versionLabels.setVersionLabel(
      documentType,
      contour,
      versionId,
      label,
    );
  }

  async getActiveVersionId(
    documentType: string,
    contour: string,
  ): Promise<string | undefined> {
    return this.activations.getActiveVersionId(documentType, contour);
  }

  async setActiveVersionId(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<void> {
    await this.activations.setActiveVersionId(documentType, contour, versionId);
  }

  async appendActivation(record: ActivationRecord): Promise<void> {
    await this.activations.appendActivation(record);
  }

  async wasActivated(
    documentType: string,
    contour: string,
    versionId: string,
  ): Promise<boolean> {
    return this.activations.wasActivated(documentType, contour, versionId);
  }

  async getQuarantine(jobId: string): Promise<QuarantineItem[]> {
    return this.quarantine.getQuarantine(jobId);
  }

  async appendQuarantine(
    jobId: string,
    items: QuarantineItem[],
  ): Promise<void> {
    await this.quarantine.appendQuarantine(jobId, items);
  }

  async markSyntheticIndex(index: string): Promise<void> {
    await this.syntheticMarks.markSyntheticIndex(index);
  }

  async markSyntheticSource(sourceIndex: string): Promise<void> {
    await this.syntheticMarks.markSyntheticSource(sourceIndex);
  }

  async appendPublishedIds(jobId: string, ids: string[]): Promise<void> {
    await this.publishedIds.appendPublishedIds(jobId, ids);
  }

  async getPublishedIds(jobId: string): Promise<string[]> {
    return this.publishedIds.getPublishedIds(jobId);
  }

  async saveDraftDocuments(
    jobId: string,
    documents: DraftDocument[],
  ): Promise<void> {
    await this.drafts.saveDraftDocuments(jobId, documents);
  }

  async getDraftDocuments(jobId: string): Promise<DraftDocument[]> {
    return this.drafts.getDraftDocuments(jobId);
  }

  async listDocumentTypes(): Promise<DocumentTypeRecord[]> {
    return this.documentTypes.listDocumentTypes();
  }

  async hasDocumentType(documentType: string): Promise<boolean> {
    return this.documentTypes.hasDocumentType(documentType);
  }

  async addDocumentType(documentType: string): Promise<void> {
    await this.documentTypes.addDocumentType(documentType);
  }

  async deleteDocumentType(documentType: string): Promise<void> {
    await this.documentTypes.deleteDocumentType(documentType);
  }
}
