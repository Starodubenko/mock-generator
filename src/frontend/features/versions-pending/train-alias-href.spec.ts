import { trainAliasHrefFromLive } from './train-alias-href';

describe('trainAliasHrefFromLive', () => {
  it('should_prefer_name_version_when_train_job_succeeded', () => {
    expect(
      trainAliasHrefFromLive({
        kind: 'train',
        state: 'succeeded',
        contour: 'test-stand',
        documentType: 'document',
        profileVersionId: 'ver-1',
        jobId: 'job-1',
        fallbackHref: '/document-types?nameJob=job-1',
      }),
    ).toBe(
      '/document-types?contour=test-stand&open=document&nameVersion=ver-1&nameJob=job-1',
    );
  });

  it('should_keep_fallback_until_version_exists', () => {
    expect(
      trainAliasHrefFromLive({
        kind: 'train',
        state: 'profiling',
        contour: 'test-stand',
        documentType: 'document',
        profileVersionId: null,
        fallbackHref: '/document-types?nameJob=job-1',
      }),
    ).toBe('/document-types?nameJob=job-1');
  });
});
