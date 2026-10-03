import { createRpcDouble } from '../rpc-double';
import { NeighborDraftRepository } from './neighbor-draft.repository';

describe('NeighborDraftRepository', () => {
  it('should_save_and_get_drafts', async () => {
    const { rpc, call } = createRpcDouble();
    const documents = [{ id: 'd1', body: { status: 'NEW' } }];
    call.mockResolvedValueOnce(undefined).mockResolvedValueOnce(documents);
    const repository = new NeighborDraftRepository(rpc);
    await repository.saveDraftDocuments('job-1', documents);
    await expect(repository.getDraftDocuments('job-1')).resolves.toEqual(
      documents,
    );
    expect(call).toHaveBeenNthCalledWith(1, 'saveDraftDocuments', {
      jobId: 'job-1',
      documents,
    });
  });
});
