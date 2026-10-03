import { createRpcDouble } from '../rpc-double';
import { NeighborTrainingInFlightRepository } from './neighbor-training-in-flight.repository';

describe('NeighborTrainingInFlightRepository', () => {
  it('should_call_training_in_flight_ops', async () => {
    const { rpc, call } = createRpcDouble();
    call
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    const repository = new NeighborTrainingInFlightRepository(rpc);
    await expect(repository.hasTrainingInFlight('k1')).resolves.toBe(true);
    await repository.setTrainingInFlight('k1', 'job-1');
    await repository.clearTrainingInFlight('k1');
    expect(call).toHaveBeenNthCalledWith(1, 'hasTrainingInFlight', {
      key: 'k1',
    });
    expect(call).toHaveBeenNthCalledWith(2, 'setTrainingInFlight', {
      key: 'k1',
      jobId: 'job-1',
    });
    expect(call).toHaveBeenNthCalledWith(3, 'clearTrainingInFlight', {
      key: 'k1',
    });
  });
});
