import type { JobRecord } from '@entities/job/job.types';
import { createRpcDouble } from '../rpc-double';
import { NeighborJobRepository } from './neighbor-job.repository';

const job: JobRecord = {
  jobId: 'job-1',
  kind: 'train',
  documentType: 'document',
  contour: 'test-stand',
  state: 'accepted',
  profileVersionId: null,
  seed: null,
  requestedCount: null,
  publishedCount: 0,
  quarantineCount: 0,
  reason: null,
  createdAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  checkpointDocumentNumber: 0,
  targetIndex: null,
  generatedAt: null,
};

describe('NeighborJobRepository', () => {
  it('should_map_null_job_to_undefined', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(null);
    const repository = new NeighborJobRepository(rpc);
    await expect(repository.getJob('job-1')).resolves.toBeUndefined();
    expect(call).toHaveBeenCalledWith('getJob', { jobId: 'job-1' });
  });

  it('should_save_and_list_jobs', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValueOnce(undefined).mockResolvedValueOnce([job]);
    const repository = new NeighborJobRepository(rpc);
    await repository.saveJob(job);
    await expect(
      repository.listJobs({ contour: 'test-stand' }),
    ).resolves.toEqual([job]);
    expect(call).toHaveBeenNthCalledWith(1, 'saveJob', { job });
    expect(call).toHaveBeenNthCalledWith(2, 'listJobs', {
      filter: { contour: 'test-stand' },
    });
  });
});
