import { Injectable } from '@nestjs/common';
import { NeighborHttp } from './neighbor-http';

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

@Injectable()
export class NeighborRpc {
  constructor(private readonly http: NeighborHttp) {}

  async call<T>(op: string, args: Record<string, unknown> = {}): Promise<T> {
    const response = await this.http.send<unknown>(
      'post',
      '/internal/v1/process-store',
      {
        caller: 'NeighborProcessStore',
        data: { op, args },
      },
    );
    if (response.status >= 400) {
      throw Object.assign(new Error(`process_store_${response.status}`), {
        status: response.status,
        data: response.data,
      });
    }
    return asRecord(response.data).result as T;
  }
}
