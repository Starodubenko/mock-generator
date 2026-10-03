import { createGatewayDouble } from '../gateway-double';
import { NeighborJobPurgeRepository } from './neighbor-job-purge.repository';

describe('NeighborJobPurgeRepository', () => {
  it('should_purge_job_documents', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({ status: 204, data: undefined });
    await new NeighborJobPurgeRepository(gateway).purgeJobDocuments({
      contour: 'test-stand',
      index: 'documents-synthetic',
      jobId: 'job-9',
    });
    expect(send).toHaveBeenCalledWith(
      'delete',
      '/internal/v1/indexes/documents-synthetic/documents?contour=test-stand&jobId=job-9',
      { caller: 'NeighborIndexHttpClient' },
    );
  });

  it('should_throw_on_forbidden_purge', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({ status: 403, data: { reason: 'prod_target' } });
    await expect(
      new NeighborJobPurgeRepository(gateway).purgeJobDocuments({
        contour: 'prod',
        index: 'documents-main',
        jobId: 'job-9',
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'prod_target' });
  });
});
