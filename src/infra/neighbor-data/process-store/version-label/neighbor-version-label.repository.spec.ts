import { createRpcDouble } from '../rpc-double';
import { NeighborVersionLabelRepository } from './neighbor-version-label.repository';

describe('NeighborVersionLabelRepository', () => {
  it('should_map_null_label_to_undefined', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(null);
    await expect(
      new NeighborVersionLabelRepository(rpc).getVersionLabel(
        'document',
        'test-stand',
        'v1',
      ),
    ).resolves.toBeUndefined();
  });

  it('should_set_version_label', async () => {
    const { rpc, call } = createRpcDouble();
    call.mockResolvedValue(undefined);
    await new NeighborVersionLabelRepository(rpc).setVersionLabel(
      'document',
      'test-stand',
      'v1',
      'стенд',
    );
    expect(call).toHaveBeenCalledWith('setVersionLabel', {
      documentType: 'document',
      contour: 'test-stand',
      versionId: 'v1',
      label: 'стенд',
    });
  });
});
