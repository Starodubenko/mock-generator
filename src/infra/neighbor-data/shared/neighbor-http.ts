import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export const acceptNeighborStatus = (status: number): boolean => status < 500;

export type NeighborHttpResponse<T = unknown> = {
  status: number;
  data: T;
};

@Injectable()
export class NeighborHttp {
  constructor(private readonly http: HttpService) {}

  optionalBaseUrl(): string {
    return process.env.INDEXER_BASE_URL ?? '';
  }

  requireBaseUrl(caller: string): string {
    const url = this.optionalBaseUrl();
    if (!url) {
      throw new Error(`INDEXER_BASE_URL is required for ${caller}`);
    }
    return url;
  }

  headers(jobId?: string, batchNo?: number): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Service-Name': 'synthetic-data-generator',
    };
    if (process.env.PLATFORM_SERVICE_TOKEN) {
      headers.Authorization = `Bearer ${process.env.PLATFORM_SERVICE_TOKEN}`;
    }
    if (jobId !== undefined && batchNo !== undefined) {
      headers['Idempotency-Key'] = `${jobId}:${batchNo}`;
    }
    return headers;
  }

  async send<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head',
    path: string,
    options: {
      caller: string;
      data?: unknown;
      params?: Record<string, unknown>;
      jobId?: string;
      batchNo?: number;
    },
  ): Promise<NeighborHttpResponse<T>> {
    const url = `${this.requireBaseUrl(options.caller)}${path}`;
    const config = {
      headers: this.headers(options.jobId, options.batchNo),
      validateStatus: acceptNeighborStatus,
      params: options.params,
    };
    const source =
      method === 'get' || method === 'head'
        ? this.http.get(url, config)
        : method === 'delete'
          ? this.http.delete(url, config)
          : method === 'put'
            ? this.http.put(url, options.data, config)
            : method === 'patch'
              ? this.http.patch(url, options.data, config)
              : this.http.post(url, options.data, config);
    const response = await firstValueFrom(source);
    return { status: response.status, data: response.data as T };
  }
}
