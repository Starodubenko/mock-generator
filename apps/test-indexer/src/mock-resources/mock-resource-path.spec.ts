import { normalizeMockResourcePath } from './mock-resource-path';

describe('normalizeMockResourcePath', () => {
  it('should_accept_api_paths_and_reject_internal_or_traversal', () => {
    expect(normalizeMockResourcePath('/api/tasks')).toBe('/api/tasks');
    expect(normalizeMockResourcePath('  /api/tasks  ')).toBe('/api/tasks');
    expect(normalizeMockResourcePath('api/tasks')).toBeNull();
    expect(normalizeMockResourcePath('/internal/v1/health')).toBeNull();
    expect(normalizeMockResourcePath('/internal')).toBeNull();
    expect(normalizeMockResourcePath('/api/../tasks')).toBeNull();
    expect(normalizeMockResourcePath('/api//tasks')).toBeNull();
    expect(normalizeMockResourcePath('/api/tasks?x=1')).toBeNull();
  });
});
