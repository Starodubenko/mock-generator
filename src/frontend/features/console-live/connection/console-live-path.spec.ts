import {
  consoleLiveFallbackHref,
  jobIdFromConsolePath,
} from './console-live-path';

describe('console-live path helpers', () => {
  it('should_read_job_id_from_card_and_subpaths', () => {
    expect(jobIdFromConsolePath('/jobs/new')).toBeNull();
    expect(jobIdFromConsolePath('/jobs/abc-1')).toBe('abc-1');
    expect(jobIdFromConsolePath('/jobs/abc-1/data')).toBe('abc-1');
    expect(jobIdFromConsolePath('/jobs/abc-1/quarantine')).toBe('abc-1');
    expect(jobIdFromConsolePath('/jobs/abc-1/status')).toBe('abc-1');
    expect(jobIdFromConsolePath('/jobs/abc-1/confirm/publish')).toBe('abc-1');
  });

  it('should_keep_fallback_on_the_current_job_surface', () => {
    expect(
      consoleLiveFallbackHref('/jobs/abc-1', '?contour=test-stand', 'abc-1'),
    ).toBe('/jobs/abc-1?contour=test-stand');
    expect(consoleLiveFallbackHref('/jobs/abc-1/data', '', 'abc-1')).toBe(
      '/jobs/abc-1/data',
    );
    expect(consoleLiveFallbackHref('/jobs/abc-1/status', '', 'abc-1')).toBe(
      '/jobs/abc-1/status',
    );
    expect(consoleLiveFallbackHref('/jobs', '', 'abc-1')).toBe('/jobs/abc-1');
  });
});
