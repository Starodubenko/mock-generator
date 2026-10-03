import { Injectable } from '@nestjs/common';
import {
  mockResourceKey,
  normalizeMockGroup,
  normalizeMockHttpMethod,
  normalizeMockResourcePath,
  normalizeMockSummary,
  type MockHttpMethod,
} from '@entities/mock-resource/mock-resource-path';
import {
  MockResourcePort,
  type MockBodyPut,
  type MockCatalogPut,
  type MockResourceMeta,
  type MockResourcePutResult,
} from '@repositories/mock-resource.port';
import { inMemoryDatabase } from './in-memory-database';

const asMeta = (item: {
  method: string;
  path: string;
  group: string;
  summary: string;
  jobId: string;
  body: unknown | undefined;
  updatedAt: string;
}): MockResourceMeta => ({
  method: item.method as MockHttpMethod,
  path: item.path,
  group: item.group,
  summary: item.summary,
  jobId: item.jobId,
  updatedAt: item.updatedAt,
  hasBody: item.body !== undefined,
});

@Injectable()
export class LocalMockResourceAdapter extends MockResourcePort {
  async list(): Promise<MockResourceMeta[]> {
    return [...inMemoryDatabase.mockResources.values()]
      .map(asMeta)
      .sort((left, right) =>
        `${left.group}${left.path}${left.method}`.localeCompare(
          `${right.group}${right.path}${right.method}`,
        ),
      );
  }

  async listGroups(): Promise<string[]> {
    const fromEndpoints = [...inMemoryDatabase.mockResources.values()].map(
      (item) => item.group,
    );
    return [
      ...new Set([...inMemoryDatabase.mockGroups, ...fromEndpoints]),
    ].sort((left, right) => left.localeCompare(right));
  }

  async addGroup(name: string): Promise<void> {
    const group = normalizeMockGroup(name);
    if (!group) {
      throw Object.assign(new Error('validation_error'), {
        reason: 'validation_error',
      });
    }
    inMemoryDatabase.mockGroups.add(group);
  }

  async removeGroup(name: string): Promise<void> {
    const group = normalizeMockGroup(name);
    if (!group) {
      return;
    }
    inMemoryDatabase.mockGroups.delete(group);
    for (const [key, item] of inMemoryDatabase.mockResources) {
      if (item.group === group) {
        inMemoryDatabase.mockResources.delete(key);
      }
    }
  }

  async upsertCatalog(input: MockCatalogPut): Promise<MockResourceMeta> {
    const parsed = this.parseCatalog(input);
    const key = mockResourceKey(parsed.method, parsed.path);
    const previous = inMemoryDatabase.mockResources.get(key);
    const updatedAt = new Date().toISOString();
    const next = {
      method: parsed.method,
      path: parsed.path,
      group: parsed.group,
      summary: parsed.summary,
      jobId: previous?.jobId ?? '',
      body: previous?.body,
      updatedAt,
    };
    inMemoryDatabase.mockResources.set(key, next);
    inMemoryDatabase.mockGroups.add(parsed.group);
    return asMeta(next);
  }

  async putBody(input: MockBodyPut): Promise<MockResourcePutResult> {
    const method = normalizeMockHttpMethod(input.method);
    const path = normalizeMockResourcePath(input.path);
    if (!method || !path) {
      throw Object.assign(new Error('validation_error'), {
        reason: 'validation_error',
      });
    }
    const key = mockResourceKey(method, path);
    const previous = inMemoryDatabase.mockResources.get(key);
    const updatedAt = new Date().toISOString();
    const group = previous?.group ?? 'default';
    inMemoryDatabase.mockResources.set(key, {
      method,
      path,
      group,
      summary: previous?.summary ?? '',
      jobId: input.jobId,
      body: input.body,
      updatedAt,
    });
    inMemoryDatabase.mockGroups.add(group);
    return { method, path, sharePath: path };
  }

  async remove(method: string, path: string): Promise<void> {
    const verb = normalizeMockHttpMethod(method);
    const normalized = normalizeMockResourcePath(path);
    if (!verb || !normalized) {
      return;
    }
    inMemoryDatabase.mockResources.delete(mockResourceKey(verb, normalized));
  }

  async get(path: string, method = 'GET'): Promise<unknown | undefined> {
    const verb = normalizeMockHttpMethod(method);
    const normalized = normalizeMockResourcePath(path);
    if (!verb || !normalized) {
      return undefined;
    }
    const exact = inMemoryDatabase.mockResources.get(
      mockResourceKey(verb, normalized),
    );
    if (exact?.body !== undefined) {
      return exact.body;
    }
    if (verb === 'HEAD') {
      return inMemoryDatabase.mockResources.get(
        mockResourceKey('GET', normalized),
      )?.body;
    }
    return undefined;
  }

  private parseCatalog(input: MockCatalogPut): {
    method: MockHttpMethod;
    path: string;
    group: string;
    summary: string;
  } {
    const method = normalizeMockHttpMethod(input.method);
    const path = normalizeMockResourcePath(input.path);
    const group = normalizeMockGroup(input.group);
    if (!method || !path || !group) {
      throw Object.assign(new Error('validation_error'), {
        reason: 'validation_error',
      });
    }
    return {
      method,
      path,
      group,
      summary: normalizeMockSummary(input.summary),
    };
  }
}
