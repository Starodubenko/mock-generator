import { createGatewayDouble } from '../gateway-double';
import { NeighborDocumentBatchRepository } from './neighbor-document-batch.repository';

const command = {
  contour: 'test-stand',
  index: 'documents-synthetic',
  jobId: 'job-9',
  batchNo: 1,
  mode: 'canary' as const,
  documents: [{ id: 'd1', body: { status: 'NEW' } }],
};

describe('NeighborDocumentBatchRepository', () => {
  it('should_upsert_with_idempotency_key_fields', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({
      status: 200,
      data: { accepted: ['d1'], rejected: [] },
    });
    await expect(
      new NeighborDocumentBatchRepository(gateway).upsertBatch(command),
    ).resolves.toEqual({ accepted: ['d1'], rejected: [] });
    const firstCall = send.mock.calls[0] as unknown as [
      string,
      string,
      {
        jobId: string;
        batchNo: number;
        data: {
          contour: string;
          jobId: string;
          batchNo: number;
          mode: string;
        };
      },
    ];
    expect(firstCall[0]).toBe('put');
    expect(firstCall[1]).toBe(
      '/internal/v1/indexes/documents-synthetic/documents:batch',
    );
    expect(firstCall[2].jobId).toBe('job-9');
    expect(firstCall[2].batchNo).toBe(1);
    expect(firstCall[2].data).toEqual({
      contour: 'test-stand',
      jobId: 'job-9',
      batchNo: 1,
      mode: 'canary',
      documents: command.documents,
    });
  });

  it('should_map_429_to_retryAfterMs', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({ status: 429, data: { retryAfterMs: 40 } });
    await expect(
      new NeighborDocumentBatchRepository(gateway).upsertBatch(command),
    ).resolves.toEqual({ accepted: [], rejected: [], retryAfterMs: 40 });
  });

  it('should_map_403_upsert_to_port_forbidden', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({ status: 403, data: { reason: 'prod_target' } });
    await expect(
      new NeighborDocumentBatchRepository(gateway).upsertBatch({
        ...command,
        contour: 'prod',
        index: 'documents-main',
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'prod_target' });
  });
});
