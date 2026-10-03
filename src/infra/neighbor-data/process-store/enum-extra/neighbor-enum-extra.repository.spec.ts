import { createRpcDouble } from '../rpc-double';
import { NeighborEnumExtraRepository } from './neighbor-enum-extra.repository';

describe('NeighborEnumExtraRepository', () => {
  it('should_get_and_add_enum_extras', async () => {
    const { rpc, call } = createRpcDouble();
    call
      .mockResolvedValueOnce({ 'payload.status': ['NEW'] })
      .mockResolvedValueOnce(undefined);
    const repository = new NeighborEnumExtraRepository(rpc);
    await expect(
      repository.getEnumExtras('document', 'test-stand', 'v1'),
    ).resolves.toEqual({ 'payload.status': ['NEW'] });
    await repository.addEnumExtra(
      'document',
      'test-stand',
      'v1',
      'payload.status',
      'DONE',
    );
    expect(call).toHaveBeenNthCalledWith(2, 'addEnumExtra', {
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      path: 'payload.status',
      value: 'DONE',
    });
  });
});
