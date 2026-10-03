import { isProdContour, isSyntheticIndex, loadIndexerConfig } from './config';

describe('indexer config', () => {
  it('should_treat_suffix_as_synthetic_and_prod_prefix_as_prod', () => {
    const config = { ...loadIndexerConfig(), syntheticSuffix: '-synthetic', prodContours: ['prod'] };
    expect(isSyntheticIndex(config, 'documents-synthetic')).toBe(true);
    expect(isSyntheticIndex(config, 'documents-reference')).toBe(false);
    expect(isProdContour(config, 'prod')).toBe(true);
    expect(isProdContour(config, 'prod-main')).toBe(true);
    expect(isProdContour(config, 'test-stand')).toBe(false);
  });
});
