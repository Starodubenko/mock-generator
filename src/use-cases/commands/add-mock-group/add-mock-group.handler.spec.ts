import { AddMockGroupHandler } from './add-mock-group.handler';
import { DomainHttpException } from '@app/domain-http.exception';
import type { MockResourcePort } from '@repositories/mock-resource.port';

describe('AddMockGroupHandler', () => {
  it('should_reject_blank_and_duplicate_group_names', async () => {
    const resources = {
      listGroups: jest.fn(async () => ['Orders']),
      addGroup: jest.fn(async () => undefined),
    } as unknown as MockResourcePort;
    const handler = new AddMockGroupHandler(resources);
    await expect(handler.execute('   ')).rejects.toThrow(DomainHttpException);
    await expect(handler.execute('orders')).rejects.toThrow(DomainHttpException);
    try {
      await handler.execute('Orders');
    } catch (error) {
      expect((error as DomainHttpException).getResponse()).toMatchObject({
        reason: 'mock_group_exists',
      });
    }
    expect(resources.addGroup).not.toHaveBeenCalled();
    await handler.execute('Payments');
    expect(resources.addGroup).toHaveBeenCalledWith('Payments');
  });
});
