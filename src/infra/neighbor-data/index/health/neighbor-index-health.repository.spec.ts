import { createGatewayDouble } from '../gateway-double';
import { NeighborIndexHealthRepository } from './neighbor-index-health.repository';

describe('NeighborIndexHealthRepository', () => {
  it('should_ping_health', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockResolvedValue({ status: 200, data: { status: 'up' } });
    await expect(
      new NeighborIndexHealthRepository(gateway).ping(),
    ).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith('get', '/internal/v1/health', {
      caller: 'NeighborIndexHttpClient',
    });
  });

  it('should_return_false_when_health_throws', async () => {
    const { gateway, send } = createGatewayDouble();
    send.mockRejectedValue(new Error('down'));
    await expect(
      new NeighborIndexHealthRepository(gateway).ping(),
    ).resolves.toBe(false);
  });
});
