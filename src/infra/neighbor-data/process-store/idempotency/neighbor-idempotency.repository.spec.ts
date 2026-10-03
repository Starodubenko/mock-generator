import { createRpcDouble } from '../rpc-double';
import { NeighborIdempotencyRepository } from './neighbor-idempotency.repository';

describe('NeighborIdempotencyRepository', () => {
  it('should_map_null_idempotency_to_undefined', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(null);
    const repository = new NeighborIdempotencyRepository(rpc);
    await expect(repository.getIdempotency('k1')).resolves.toBeUndefined();
    expect(call).toHaveBeenCalledWith('getIdempotency', { key: 'k1' });
  });

  it('should_save_idempotency', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(undefined);
    const record = { key: 'k1', bodyHash: 'h', jobId: 'job-1' };
    await new NeighborIdempotencyRepository(rpc).saveIdempotency(record);
    expect(call).toHaveBeenCalledWith('saveIdempotency', { record });
  });
});
