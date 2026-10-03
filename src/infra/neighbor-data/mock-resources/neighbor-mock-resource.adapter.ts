import { Injectable, Optional } from '@nestjs/common';
import { LocalMockResourceAdapter } from '@infra/local-data/local-mock-resource.adapter';
import type { MockHttpMethod } from '@entities/mock-resource/mock-resource-path';
import {
  MockResourcePort,
  type MockBodyPut,
  type MockCatalogPut,
  type MockResourceMeta,
  type MockResourcePutResult,
} from '@repositories/mock-resource.port';
import { NeighborHttp } from '../shared/neighbor-http';

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asMeta = (value: unknown): MockResourceMeta | null => {
  const row = asRecord(value);
  if (
    typeof row.path !== 'string' ||
    typeof row.method !== 'string' ||
    typeof row.group !== 'string' ||
    typeof row.summary !== 'string' ||
    typeof row.jobId !== 'string' ||
    typeof row.updatedAt !== 'string'
  ) {
    return null;
  }
  return {
    method: row.method as MockHttpMethod,
    path: row.path,
    group: row.group,
    summary: row.summary,
    jobId: row.jobId,
    updatedAt: row.updatedAt,
    hasBody: row.hasBody === true,
  };
};

@Injectable()
export class NeighborMockResourceAdapter extends MockResourcePort {
  constructor(
    private readonly http: NeighborHttp,
    @Optional() private readonly fallback?: LocalMockResourceAdapter,
  ) {
    super();
  }

  async list(): Promise<MockResourceMeta[]> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().list();
    }
    const response = await this.http.send<{ resources?: unknown }>(
      'get',
      '/internal/v1/mock-resources',
      { caller: 'NeighborMockResourceAdapter' },
    );
    const resources = Array.isArray(response.data.resources)
      ? response.data.resources
      : [];
    return resources.flatMap((item) => {
      const meta = asMeta(item);
      return meta ? [meta] : [];
    });
  }

  async listGroups(): Promise<string[]> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().listGroups();
    }
    const response = await this.http.send<{ groups?: unknown }>(
      'get',
      '/internal/v1/mock-resources/groups',
      { caller: 'NeighborMockResourceAdapter' },
    );
    return Array.isArray(response.data.groups)
      ? response.data.groups.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
  }

  async addGroup(name: string): Promise<void> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().addGroup(name);
    }
    const response = await this.http.send(
      'put',
      '/internal/v1/mock-resources/groups',
      { caller: 'NeighborMockResourceAdapter', data: { name } },
    );
    if (response.status >= 400) {
      throw Object.assign(new Error('validation_error'), {
        reason: 'validation_error',
      });
    }
  }

  async removeGroup(name: string): Promise<void> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().removeGroup(name);
    }
    await this.http.send('delete', '/internal/v1/mock-resources/groups', {
      caller: 'NeighborMockResourceAdapter',
      params: { name },
    });
  }

  async upsertCatalog(input: MockCatalogPut): Promise<MockResourceMeta> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().upsertCatalog(input);
    }
    const response = await this.http.send<MockResourceMeta>(
      'put',
      '/internal/v1/mock-resources',
      { caller: 'NeighborMockResourceAdapter', data: input },
    );
    if (response.status >= 400) {
      throw Object.assign(new Error('validation_error'), {
        reason: 'validation_error',
      });
    }
    return (
      asMeta(response.data) ?? {
        method: input.method as MockHttpMethod,
        path: input.path,
        group: input.group,
        summary: input.summary,
        jobId: '',
        updatedAt: '',
        hasBody: false,
      }
    );
  }

  async putBody(input: MockBodyPut): Promise<MockResourcePutResult> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().putBody(input);
    }
    const response = await this.http.send<MockResourcePutResult>(
      'put',
      '/internal/v1/mock-resources/body',
      { caller: 'NeighborMockResourceAdapter', data: input },
    );
    if (response.status >= 400) {
      throw Object.assign(new Error('validation_error'), {
        reason: 'validation_error',
      });
    }
    const data = asRecord(response.data);
    const path = typeof data.path === 'string' ? data.path : input.path;
    const method = typeof data.method === 'string' ? data.method : input.method;
    const sharePath =
      typeof data.sharePath === 'string' ? data.sharePath : path;
    return { method, path, sharePath };
  }

  async remove(method: string, path: string): Promise<void> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().remove(method, path);
    }
    await this.http.send('delete', '/internal/v1/mock-resources', {
      caller: 'NeighborMockResourceAdapter',
      params: { method, path },
    });
  }

  async get(path: string, method = 'GET'): Promise<unknown | undefined> {
    if (!this.http.optionalBaseUrl()) {
      return this.requireFallback().get(path, method);
    }
    const verb =
      method.toLowerCase() === 'head'
        ? 'get'
        : method.toLowerCase() === 'patch'
          ? 'patch'
          : method.toLowerCase() === 'put'
            ? 'put'
            : method.toLowerCase() === 'delete'
              ? 'delete'
              : method.toLowerCase() === 'post'
                ? 'post'
                : 'get';
    const response = await this.http.send<unknown>(verb, path, {
      caller: 'NeighborMockResourceAdapter',
    });
    if (response.status === 404) {
      return undefined;
    }
    return response.data;
  }

  private requireFallback(): LocalMockResourceAdapter {
    if (!this.fallback) {
      throw new Error(
        'INDEXER_BASE_URL is required for NeighborMockResourceAdapter',
      );
    }
    return this.fallback;
  }
}
