import { mapCatalogToSnapshot } from './map-active-version-snapshot';

describe('mapCatalogToSnapshot', () => {
  it('should_format_titles_and_captions', () => {
    expect(
      mapCatalogToSnapshot({
        contour: 'test-stand',
        ready: true,
        items: [
          {
            documentType: 'document',
            activeVersionId: '3bfbf9eb',
            activeVersionLabel: 'стенд',
          },
          {
            documentType: 'related',
            activeVersionId: null,
            activeVersionLabel: null,
          },
        ],
      }),
    ).toEqual({
      contour: 'test-stand',
      ready: true,
      items: [
        {
          documentType: 'document',
          title: 'document',
          versionId: '3bfbf9eb',
          caption: '3bfbf9eb — стенд',
        },
        {
          documentType: 'related',
          title: 'related',
          versionId: null,
          caption: 'нет',
        },
      ],
    });
  });
});
