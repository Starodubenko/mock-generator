jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import type { NeighborRpc } from '../shared/neighbor-rpc';

export const createRpcDouble = (): {
  rpc: NeighborRpc;
  call: jest.Mock;
} => {
  const call = jest.fn();
  return { rpc: { call } as unknown as NeighborRpc, call };
};
