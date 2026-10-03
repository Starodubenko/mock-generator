import { Injectable } from '@nestjs/common';
import { PostgresProcessStore } from '../process-store/postgres-process.store';
import { normalizeMockResourcePath } from './mock-resource-path';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const;

const normalizeMethod = (raw: string): (typeof METHODS)[number] | null => {
  const method = raw.trim().toUpperCase();
  return METHODS.includes(method as (typeof METHODS)[number])
    ? (method as (typeof METHODS)[number])
    : null;
};

const normalizeGroup = (raw: string): string | null => {
  const name = raw.trim();
  if (!name || name.length > 64 || name.includes('/') || name.includes('..')) {
    return null;
  }
  return name;
};

export type MockResourceMeta = {
  method: string;
  path: string;
  group: string;
  summary: string;
  jobId: string;
  updatedAt: string;
  hasBody: boolean;
};

@Injectable()
export class MockResourcesService {
  constructor(private readonly store: PostgresProcessStore) {}

  async ensureTable(): Promise<void> {
    await this.store.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "mock_groups" (
        "name" TEXT NOT NULL,
        CONSTRAINT "mock_groups_pkey" PRIMARY KEY ("name")
      )
    `);
    await this.store.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "mock_resources" (
        "method" TEXT NOT NULL DEFAULT 'GET',
        "path" TEXT NOT NULL,
        "group_name" TEXT NOT NULL DEFAULT 'default',
        "summary" TEXT NOT NULL DEFAULT '',
        "job_id" TEXT NOT NULL DEFAULT '',
        "body" TEXT,
        "updated_at" TEXT NOT NULL,
        CONSTRAINT "mock_resources_pkey" PRIMARY KEY ("method", "path")
      )
    `);
  }

  async list(): Promise<MockResourceMeta[]> {
    await this.ensureTable();
    const rows = await this.store.prisma.mockResource.findMany({
      orderBy: [{ groupName: 'asc' }, { path: 'asc' }, { method: 'asc' }],
    });
    return rows.map((row) => ({
      method: row.method,
      path: row.path,
      group: row.groupName,
      summary: row.summary,
      jobId: row.jobId,
      updatedAt: row.updatedAt,
      hasBody: row.body !== null,
    }));
  }

  async listGroups(): Promise<string[]> {
    await this.ensureTable();
    const groups = await this.store.prisma.mockGroup.findMany({
      orderBy: { name: 'asc' },
    });
    const fromEndpoints = await this.store.prisma.mockResource.findMany({
      select: { groupName: true },
    });
    return [
      ...new Set([
        ...groups.map((item) => item.name),
        ...fromEndpoints.map((item) => item.groupName),
      ]),
    ].sort((left, right) => left.localeCompare(right));
  }

  async addGroup(name: string): Promise<void> {
    const group = normalizeGroup(name);
    if (!group) {
      throw Object.assign(new Error('validation_error'), {
        status: 400,
        reason: 'validation_error',
      });
    }
    await this.ensureTable();
    await this.store.prisma.mockGroup.upsert({
      where: { name: group },
      create: { name: group },
      update: {},
    });
  }

  async removeGroup(name: string): Promise<void> {
    const group = normalizeGroup(name);
    if (!group) {
      return;
    }
    await this.ensureTable();
    await this.store.prisma.mockResource.deleteMany({
      where: { groupName: group },
    });
    await this.store.prisma.mockGroup.deleteMany({ where: { name: group } });
  }

  async get(path: string, method = 'GET'): Promise<unknown | undefined> {
    const normalized = normalizeMockResourcePath(path);
    const verb = normalizeMethod(method);
    if (!normalized || !verb) {
      return undefined;
    }
    await this.ensureTable();
    const row = await this.store.prisma.mockResource.findUnique({
      where: { method_path: { method: verb, path: normalized } },
    });
    if (row?.body) {
      try {
        return JSON.parse(row.body) as unknown;
      } catch {
        return undefined;
      }
    }
    if (verb === 'HEAD') {
      return this.get(normalized, 'GET');
    }
    return undefined;
  }

  async upsertCatalog(input: {
    method: string;
    path: string;
    group: string;
    summary: string;
  }): Promise<MockResourceMeta> {
    const method = normalizeMethod(input.method);
    const path = normalizeMockResourcePath(input.path);
    const group = normalizeGroup(input.group);
    if (!method || !path || !group) {
      throw Object.assign(new Error('validation_error'), {
        status: 400,
        reason: 'validation_error',
      });
    }
    await this.ensureTable();
    await this.store.prisma.mockGroup.upsert({
      where: { name: group },
      create: { name: group },
      update: {},
    });
    const previous = await this.store.prisma.mockResource.findUnique({
      where: { method_path: { method, path } },
    });
    const updatedAt = new Date().toISOString();
    const row = await this.store.prisma.mockResource.upsert({
      where: { method_path: { method, path } },
      create: {
        method,
        path,
        groupName: group,
        summary: input.summary.trim().slice(0, 200),
        jobId: '',
        body: null,
        updatedAt,
      },
      update: {
        groupName: group,
        summary: input.summary.trim().slice(0, 200),
        updatedAt,
      },
    });
    return {
      method: row.method,
      path: row.path,
      group: row.groupName,
      summary: row.summary,
      jobId: row.jobId,
      updatedAt: row.updatedAt,
      hasBody: (previous?.body ?? row.body) !== null,
    };
  }

  async putBody(input: {
    method: string;
    path: string;
    jobId: string;
    body: unknown;
  }): Promise<{ method: string; path: string; sharePath: string }> {
    const method = normalizeMethod(input.method);
    const path = normalizeMockResourcePath(input.path);
    if (!method || !path) {
      throw Object.assign(new Error('validation_error'), {
        status: 400,
        reason: 'validation_error',
      });
    }
    await this.ensureTable();
    const previous = await this.store.prisma.mockResource.findUnique({
      where: { method_path: { method, path } },
    });
    const updatedAt = new Date().toISOString();
    const group = previous?.groupName ?? 'default';
    await this.store.prisma.mockResource.upsert({
      where: { method_path: { method, path } },
      create: {
        method,
        path,
        groupName: group,
        summary: previous?.summary ?? '',
        jobId: input.jobId,
        body: JSON.stringify(input.body),
        updatedAt,
      },
      update: {
        jobId: input.jobId,
        body: JSON.stringify(input.body),
        updatedAt,
      },
    });
    return { method, path, sharePath: path };
  }

  async remove(method: string, path: string): Promise<void> {
    const verb = normalizeMethod(method);
    const normalized = normalizeMockResourcePath(path);
    if (!verb || !normalized) {
      return;
    }
    await this.ensureTable();
    await this.store.prisma.mockResource.deleteMany({
      where: { method: verb, path: normalized },
    });
  }
}
