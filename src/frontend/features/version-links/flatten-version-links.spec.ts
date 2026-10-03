import {
  flattenVersionLinks,
  linkKindHint,
  linkKindLabel,
  linkPathsLabel,
} from './flatten-version-links';

describe('flattenVersionLinks', () => {
  it('should_flatten_all_link_kinds', () => {
    const rows = flattenVersionLinks({
      parentChildInvariants: [
        {
          parentPath: 'id',
          childPath: 'linkSections.entityId',
          arrayPath: 'children',
        },
      ],
      valueEqualities: [
        { scope: 'document', paths: ['id', 'docUuid'] },
      ],
      dateOrderInvariants: [
        { earlierPath: 'docDate', laterPath: 'creationDateTime' },
      ],
      crossTypeLinks: [
        {
          localPath: 'linkedId',
          remoteDocumentType: 'document',
          remoteField: 'id',
        },
      ],
    });
    expect(rows).toHaveLength(4);
    expect(linkKindLabel('parent-child')).toBe('родитель → ребёнок');
    expect(linkKindHint('parent-child')).toContain('элемента массива');
    expect(linkKindHint('equality')).toContain('одно сгенерированное значение');
    expect(linkKindHint('date-order')).toContain('левая не позже правой');
    expect(linkKindHint('cross-type')).toContain('другого типа');
    expect(linkKindHint('parent-child')).not.toContain('entityId');
    expect(linkKindHint('equality')).not.toContain('linkedId');
    expect(linkKindHint('date-order')).not.toContain('docDate');
    expect(linkKindHint('cross-type')).not.toContain('related');
    expect(linkPathsLabel(rows[0]!)).toContain('entityId');
  });
});
