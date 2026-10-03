import {
  isReservedConsolePath,
  normalizeMockGroup,
  normalizeMockHttpMethod,
  normalizeMockResourcePath,
} from './mock-resource-path';

describe('normalizeMockResourcePath', () => {
  it('should_keep_share_paths_and_reject_internal_or_traversal', () => {
    expect(normalizeMockResourcePath('/api/tasks')).toBe('/api/tasks');
    expect(normalizeMockResourcePath('api/tasks')).toBeNull();
    expect(normalizeMockResourcePath('/internal/v1/health')).toBeNull();
    expect(normalizeMockResourcePath('/api/../secret')).toBeNull();
    expect(normalizeMockResourcePath('/api//tasks')).toBeNull();
  });
});

describe('normalizeMockHttpMethod', () => {
  it('should_accept_swagger_verbs', () => {
    expect(normalizeMockHttpMethod('get')).toBe('GET');
    expect(normalizeMockHttpMethod('POST')).toBe('POST');
    expect(normalizeMockHttpMethod('TRACE')).toBeNull();
  });
});

describe('normalizeMockGroup', () => {
  it('should_keep_swagger_tag_names', () => {
    expect(normalizeMockGroup('Tasks')).toBe('Tasks');
    expect(normalizeMockGroup('')).toBeNull();
    expect(normalizeMockGroup('a/b')).toBeNull();
  });
});

describe('isReservedConsolePath', () => {
  it('should_skip_console_and_swagger_paths', () => {
    expect(isReservedConsolePath('/')).toBe(true);
    expect(isReservedConsolePath('/jobs/abc')).toBe(true);
    expect(isReservedConsolePath('/mocks')).toBe(true);
    expect(isReservedConsolePath('/mocks/bind')).toBe(true);
    expect(isReservedConsolePath('/api/v1/health')).toBe(true);
    expect(isReservedConsolePath('/api/docs')).toBe(true);
    expect(isReservedConsolePath('/@vite/client')).toBe(true);
    expect(isReservedConsolePath('/assets/app.js')).toBe(true);
    expect(isReservedConsolePath('/api/tasks')).toBe(false);
  });
});
