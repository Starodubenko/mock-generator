import { normalizeArrayPaths, validateArrayPaths } from './array-paths';
import type { ProfileVersion } from '../profile/profile.types';

const version = {
  paths: [
    { path: 'hits.hits', pathClass: 'array' },
    { path: 'took', pathClass: 'number-string' },
    { path: 'tags', pathClass: 'array' },
  ],
} as ProfileVersion;

describe('array-paths', () => {
  it('should_dedupe_and_trim_paths', () => {
    expect(
      normalizeArrayPaths([' hits.hits ', 'hits.hits', 'tags', '', 'tags']),
    ).toEqual(['hits.hits', 'tags']);
    expect(normalizeArrayPaths('hits.hits, tags; hits.hits')).toEqual([
      'hits.hits',
      'tags',
    ]);
  });

  it('should_accept_only_array_paths_from_profile', () => {
    expect(validateArrayPaths(['hits.hits', 'tags'], version)).toEqual({
      ok: true,
    });
    expect(validateArrayPaths(['took'], version)).toEqual({ ok: false });
    expect(validateArrayPaths(['missing'], version)).toEqual({ ok: false });
    expect(validateArrayPaths([], version)).toEqual({ ok: true });
  });
});
