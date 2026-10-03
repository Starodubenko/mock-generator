import {
  isDocumentTypeSlug,
  normalizeDocumentTypeSlug,
} from './document-type-slug';

describe('document-type-slug', () => {
  it('should_accept_kebab_ids', () => {
    expect(isDocumentTypeSlug('document')).toBe(true);
    expect(isDocumentTypeSlug('related')).toBe(true);
    expect(normalizeDocumentTypeSlug(' Related ')).toBe('related');
  });

  it('should_reject_empty_and_unsafe_ids', () => {
    expect(isDocumentTypeSlug('')).toBe(false);
    expect(isDocumentTypeSlug('Document')).toBe(false);
    expect(isDocumentTypeSlug('1start')).toBe(false);
    expect(isDocumentTypeSlug('has space')).toBe(false);
  });
});
