import { createRpcDouble } from '../rpc-double';
import { NeighborDocumentTypeRepository } from './neighbor-document-type.repository';

describe('NeighborDocumentTypeRepository', () => {
  it('should_call_document_type_ops', async () => {
    const { rpc, call } = createRpcDouble();
    call
      .mockResolvedValueOnce([{ documentType: 'document' }])
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    const repository = new NeighborDocumentTypeRepository(rpc);
    await expect(repository.listDocumentTypes()).resolves.toEqual([
      { documentType: 'document' },
    ]);
    await expect(repository.hasDocumentType('document')).resolves.toBe(true);
    await repository.addDocumentType('related');
    await repository.deleteDocumentType('related');
    expect(call).toHaveBeenNthCalledWith(1, 'listDocumentTypes');
    expect(call).toHaveBeenNthCalledWith(3, 'addDocumentType', {
      documentType: 'related',
    });
  });
});
