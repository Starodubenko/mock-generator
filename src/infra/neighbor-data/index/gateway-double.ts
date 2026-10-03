jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import type { NeighborIndexGateway } from './neighbor-index-gateway';

export const createGatewayDouble = (): {
  gateway: NeighborIndexGateway;
  send: jest.Mock;
  orFallback: jest.Mock;
} => {
  const send = jest.fn();
  const orFallback = jest.fn(
    async (
      _local: (adapter: never) => unknown,
      remote: () => Promise<unknown>,
    ) => remote(),
  );
  return {
    gateway: {
      http: { send },
      orFallback,
    } as unknown as NeighborIndexGateway,
    send,
    orFallback,
  };
};
