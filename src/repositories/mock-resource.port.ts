import type { MockHttpMethod } from '@entities/mock-resource/mock-resource-path';

export const MOCK_RESOURCE_PORT = Symbol('MOCK_RESOURCE_PORT');

export type MockResourceMeta = {
  method: MockHttpMethod;
  path: string;
  group: string;
  summary: string;
  jobId: string;
  updatedAt: string;
  hasBody: boolean;
};

export type MockCatalogPut = {
  method: string;
  path: string;
  group: string;
  summary: string;
};

export type MockBodyPut = {
  method: string;
  path: string;
  jobId: string;
  body: unknown;
};

export type MockResourcePutResult = {
  method: string;
  path: string;
  sharePath: string;
};

export abstract class MockResourcePort {
  abstract list(): Promise<MockResourceMeta[]>;
  abstract listGroups(): Promise<string[]>;
  abstract addGroup(name: string): Promise<void>;
  abstract removeGroup(name: string): Promise<void>;
  abstract upsertCatalog(input: MockCatalogPut): Promise<MockResourceMeta>;
  abstract putBody(input: MockBodyPut): Promise<MockResourcePutResult>;
  abstract remove(method: string, path: string): Promise<void>;
  abstract get(path: string, method?: string): Promise<unknown | undefined>;
}
