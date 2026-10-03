import { createGatewayDouble } from '../gateway-double';
import { NeighborCorpusSnapshotRepository } from './neighbor-corpus-snapshot.repository';

describe('NeighborCorpusSnapshotRepository', () => {
  it('should_open_read_and_close_snapshot', async () => {
    const { gateway, send } = createGatewayDouble();
    send
      .mockResolvedValueOnce({
        status: 201,
        data: { snapshotId: 'pit', keepAliveMs: 1000 },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { documents: [{ id: 'd1' }] },
      })
      .mockResolvedValueOnce({ status: 204, data: undefined });
    const repository = new NeighborCorpusSnapshotRepository(gateway);
    await expect(
      repository.openSnapshot({
        contour: 'test-stand',
        sourceIndex: 'documents-reference',
        sampleSize: 10,
      }),
    ).resolves.toEqual({ snapshotId: 'pit', keepAliveMs: 1000 });
    await expect(
      repository.readSnapshot({
        contour: 'test-stand',
        snapshotId: 'pit',
        limit: 10,
      }),
    ).resolves.toEqual({ documents: [{ id: 'd1' }] });
    await repository.closeSnapshot({
      contour: 'test-stand',
      snapshotId: 'pit',
    });
    expect(send).toHaveBeenNthCalledWith(
      1,
      'post',
      '/internal/v1/corpus/snapshots',
      expect.objectContaining({ caller: 'NeighborIndexHttpClient' }),
    );
    expect(send).toHaveBeenNthCalledWith(
      2,
      'post',
      '/internal/v1/corpus/snapshots/pit/pages',
      expect.objectContaining({ caller: 'NeighborIndexHttpClient' }),
    );
    expect(send).toHaveBeenNthCalledWith(
      3,
      'delete',
      '/internal/v1/corpus/snapshots/pit?contour=test-stand',
      expect.objectContaining({ caller: 'NeighborIndexHttpClient' }),
    );
  });

  it('should_throw_on_forbidden_open', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({
      status: 403,
      data: { reason: 'source_is_synthetic' },
    });
    await expect(
      new NeighborCorpusSnapshotRepository(gateway).openSnapshot({
        contour: 'test-stand',
        sourceIndex: 'filled-by-generator',
        sampleSize: 10,
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'source_is_synthetic' });
  });
});
