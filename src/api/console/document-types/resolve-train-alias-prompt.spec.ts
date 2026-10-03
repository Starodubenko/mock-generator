import { resolveTrainAliasPrompt } from './resolve-train-alias-prompt';

const versions = [
  { versionId: 'ver-1', label: null },
  { versionId: 'ver-old', label: 'стенд' },
];

describe('resolveTrainAliasPrompt', () => {
  it('should_open_alias_from_job_version_even_if_list_has_not_caught_up', () => {
    expect(
      resolveTrainAliasPrompt({
        queryNameVersion: null,
        openType: 'document',
        contour: 'test-stand',
        versions,
        job: {
          documentType: 'document',
          contour: 'test-stand',
          state: 'succeeded',
          profileVersionId: 'ver-new',
        },
      }),
    ).toEqual({ nameVersion: 'ver-new', pending: false });
  });

  it('should_keep_pending_while_training_has_no_version_yet', () => {
    expect(
      resolveTrainAliasPrompt({
        queryNameVersion: null,
        openType: 'document',
        contour: 'test-stand',
        versions,
        job: {
          documentType: 'document',
          contour: 'test-stand',
          state: 'profiling',
          profileVersionId: null,
        },
      }),
    ).toEqual({ nameVersion: null, pending: true });
  });

  it('should_keep_query_name_version_even_if_list_has_not_caught_up', () => {
    expect(
      resolveTrainAliasPrompt({
        queryNameVersion: 'ver-new',
        openType: 'document',
        contour: 'test-stand',
        versions,
        job: null,
      }),
    ).toEqual({ nameVersion: 'ver-new', pending: false });
  });

  it('should_skip_alias_when_version_already_has_a_label', () => {
    expect(
      resolveTrainAliasPrompt({
        queryNameVersion: null,
        openType: 'document',
        contour: 'test-stand',
        versions,
        job: {
          documentType: 'document',
          contour: 'test-stand',
          state: 'succeeded',
          profileVersionId: 'ver-old',
        },
      }),
    ).toEqual({ nameVersion: null, pending: false });
  });
});
