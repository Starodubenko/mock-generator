import { createRpcDouble } from '../rpc-double';
import { NeighborActivationRepository } from './neighbor-activation.repository';

describe('NeighborActivationRepository', () => {
  it('should_call_activation_ops', async () => {
    const { rpc, call } = createRpcDouble();
    call
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(true);
    const repository = new NeighborActivationRepository(rpc);
    await expect(
      repository.getActiveVersionId('document', 'test-stand'),
    ).resolves.toBeUndefined();
    await repository.setActiveVersionId('document', 'test-stand', 'v1');
    await repository.appendActivation({
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      previousVersionId: null,
      activatedAt: '2026-01-01T00:00:00Z',
    });
    await expect(
      repository.wasActivated('document', 'test-stand', 'v1'),
    ).resolves.toBe(true);
    expect(call).toHaveBeenNthCalledWith(2, 'setActiveVersionId', {
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
    });
  });
});
