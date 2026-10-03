import { createRpcDouble } from '../rpc-double';
import { NeighborQuarantineRepository } from './neighbor-quarantine.repository';

describe('NeighborQuarantineRepository', () => {
  it('should_get_and_append_quarantine', async () => {
    const { rpc, call } = createRpcDouble();
    const items = [{ documentId: 'd1', reason: 'transport_rejected' as const }];
    call.mockResolvedValueOnce(items).mockResolvedValueOnce(undefined);
    const repository = new NeighborQuarantineRepository(rpc);
    await expect(repository.getQuarantine('job-1')).resolves.toEqual(items);
    await repository.appendQuarantine('job-1', items);
    expect(call).toHaveBeenNthCalledWith(2, 'appendQuarantine', {
      jobId: 'job-1',
      items,
    });
  });
});
