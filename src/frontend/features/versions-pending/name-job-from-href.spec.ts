import { nameJobFromHref } from './name-job-from-href';

describe('nameJobFromHref', () => {
  it('should_read_name_job_from_document_types_query', () => {
    expect(
      nameJobFromHref(
        '/document-types?contour=test-stand&open=document&nameJob=job-1',
      ),
    ).toBe('job-1');
    expect(nameJobFromHref('/document-types?contour=test-stand')).toBeNull();
  });
});
