import { createRpcDouble } from '../rpc-double';
import { NeighborPublishedIdRepository } from './neighbor-published-id.repository';

describe('NeighborPublishedIdRepository', () => {
  it('should_append_and_get_published_ids', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValueOnce(undefined).mockResolvedValueOnce(['d1']);
    const repository = new NeighborPublishedIdRepository(rpc);
    await repository.appendPublishedIds('job-1', ['d1']);
    await expect(repository.getPublishedIds('job-1')).resolves.toEqual(['d1']);
    expect(call).toHaveBeenNthCalledWith(1, 'appendPublishedIds', {
      jobId: 'job-1',
      ids: ['d1'],
    });
  });
});
