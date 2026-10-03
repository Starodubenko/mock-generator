import { Module } from '@nestjs/common';
import { StartTrainingHandler } from './commands/start-training/start-training.handler';
import { AddProfileEnumValueHandler } from './commands/add-profile-enum-value/add-profile-enum-value.handler';
import { SaveProfileSchemaEditsHandler } from './commands/save-profile-schema-edits/save-profile-schema-edits.handler';
import { SetProfileVersionLabelHandler } from './commands/set-profile-version-label/set-profile-version-label.handler';
import { DeleteProfileVersionHandler } from './commands/delete-profile-version/delete-profile-version.handler';
import { ActivateProfileHandler } from './commands/activate-profile/activate-profile.handler';
import { RollbackProfileHandler } from './commands/rollback-profile/rollback-profile.handler';
import { StartGenerateHandler } from './commands/start-generate/start-generate.handler';
import { PublishJobHandler } from './commands/publish-job/publish-job.handler';
import { CancelJobHandler } from './commands/cancel-job/cancel-job.handler';
import { GetJobHandler } from './queries/get-job/get-job.handler';
import { GetJobDraftsHandler } from './queries/get-job-drafts/get-job-drafts.handler';
import { ListJobsHandler } from './queries/list-jobs/list-jobs.handler';
import { GetQuarantineHandler } from './queries/get-quarantine/get-quarantine.handler';
import { ListProfileVersionsHandler } from './queries/list-profile-versions/list-profile-versions.handler';
import { GetProfileVersionHandler } from './queries/get-profile-version/get-profile-version.handler';
import { GetProfileDiffHandler } from './queries/get-profile-diff/get-profile-diff.handler';
import { GetHomeHandler } from './queries/get-home/get-home.handler';
import { AddDocumentTypeHandler } from './commands/add-document-type/add-document-type.handler';
import { DeleteDocumentTypeHandler } from './commands/delete-document-type/delete-document-type.handler';
import { ListDocumentTypesHandler } from './queries/list-document-types/list-document-types.handler';
import { ListMockResourcesHandler } from './queries/list-mock-resources/list-mock-resources.handler';
import { ListMockGroupsHandler } from './queries/list-mock-groups/list-mock-groups.handler';
import { SaveMockResourceHandler } from './commands/save-mock-resource/save-mock-resource.handler';
import { UpsertMockEndpointHandler } from './commands/upsert-mock-endpoint/upsert-mock-endpoint.handler';
import { DeleteMockEndpointHandler } from './commands/delete-mock-endpoint/delete-mock-endpoint.handler';
import { AddMockGroupHandler } from './commands/add-mock-group/add-mock-group.handler';
import { DeleteMockGroupHandler } from './commands/delete-mock-group/delete-mock-group.handler';

const handlers = [
  StartTrainingHandler,
  AddDocumentTypeHandler,
  DeleteDocumentTypeHandler,
  ListDocumentTypesHandler,
  AddProfileEnumValueHandler,
  SaveProfileSchemaEditsHandler,
  SetProfileVersionLabelHandler,
  DeleteProfileVersionHandler,
  ActivateProfileHandler,
  RollbackProfileHandler,
  StartGenerateHandler,
  PublishJobHandler,
  CancelJobHandler,
  GetJobHandler,
  GetJobDraftsHandler,
  ListJobsHandler,
  GetQuarantineHandler,
  ListProfileVersionsHandler,
  GetProfileVersionHandler,
  GetProfileDiffHandler,
  GetHomeHandler,
  ListMockResourcesHandler,
  ListMockGroupsHandler,
  SaveMockResourceHandler,
  UpsertMockEndpointHandler,
  DeleteMockEndpointHandler,
  AddMockGroupHandler,
  DeleteMockGroupHandler,
];

@Module({
  providers: handlers,
  exports: handlers,
})
export class UseCasesModule {}
