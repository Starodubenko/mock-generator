import { NeighborIndexPolicy } from './neighbor-index-policy';

describe('NeighborIndexPolicy', () => {
  it('should_treat_synthetic_suffix_as_synthetic', () => {
    const policy = new NeighborIndexPolicy();
    expect(policy.isSyntheticIndex('documents-synthetic')).toBe(true);
    expect(policy.isSyntheticSource('old-synthetic')).toBe(true);
    expect(policy.isSyntheticIndex('documents-reference')).toBe(false);
  });

  it('should_treat_prod_contour', () => {
    const policy = new NeighborIndexPolicy();
    expect(policy.isProdContour('prod')).toBe(true);
    expect(policy.isProdContour('prod-west')).toBe(true);
    expect(policy.isProdContour('test-stand')).toBe(false);
  });

  it('should_ask_fallback_when_present', () => {
    const policy = new NeighborIndexPolicy({
      isSyntheticIndex: (index: string) => index === 'marked',
      isSyntheticSource: (index: string) => index === 'src',
      isProdContour: (contour: string) => contour === 'closed',
    } as never);
    expect(policy.isSyntheticIndex('marked')).toBe(true);
    expect(policy.isSyntheticSource('src')).toBe(true);
    expect(policy.isProdContour('closed')).toBe(true);
  });
});
