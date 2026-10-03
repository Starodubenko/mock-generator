import { createRpcDouble } from '../rpc-double';
import { NeighborSyntheticMarkRepository } from './neighbor-synthetic-mark.repository';

describe('NeighborSyntheticMarkRepository', () => {
  it('should_mark_synthetic_index_and_source', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(undefined);
    const repository = new NeighborSyntheticMarkRepository(rpc);
    await repository.markSyntheticIndex('documents-synthetic');
    await repository.markSyntheticSource('filled-by-generator');
    expect(call).toHaveBeenNthCalledWith(1, 'markSyntheticIndex', {
      index: 'documents-synthetic',
    });
    expect(call).toHaveBeenNthCalledWith(2, 'markSyntheticSource', {
      sourceIndex: 'filled-by-generator',
    });
  });
});
