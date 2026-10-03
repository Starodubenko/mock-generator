import {
  allowedContourNamesFromEnv,
  createConsoleSsrContext,
  readContourQuery,
} from './console-ssr-context';

describe('allowedContourNamesFromEnv', () => {
  it('should_take_contour_before_timezone', () => {
    const previous = process.env.ALLOWED_CONTOURS;
    process.env.ALLOWED_CONTOURS = 'test-stand:Europe/Moscow,dev:UTC';
    expect(allowedContourNamesFromEnv()).toEqual(['test-stand', 'dev']);
    process.env.ALLOWED_CONTOURS = previous;
  });
});

describe('readContourQuery', () => {
  it('should_read_string_and_fallback', () => {
    expect(readContourQuery({ contour: 'dev' })).toBe('dev');
    expect(readContourQuery({ contour: ['dev', 'other'] })).toBe('dev');
    expect(readContourQuery({ contour: '' })).toBe('test-stand');
    expect(readContourQuery(undefined)).toBe('test-stand');
  });
});

describe('createConsoleSsrContext', () => {
  it('should_map_catalog_items', async () => {
    const context = await createConsoleSsrContext({
      execute: (contour) => ({
        items: [
          {
            documentType: 'document',
            activeVersionId: contour === 'dev' ? 'aaa' : null,
            activeVersionLabel: contour === 'dev' ? 'стенд' : null,
          },
        ],
      }),
    })({ req: { query: { contour: 'dev' } } });
    expect(context.activeVersions).toEqual({
      contour: 'dev',
      items: [
        {
          documentType: 'document',
          activeVersionId: 'aaa',
          activeVersionLabel: 'стенд',
        },
      ],
    });
    expect(Array.isArray(context.allowedContours)).toBe(true);
  });

  it('should_return_empty_items_when_catalog_throws', async () => {
    const context = await createConsoleSsrContext({
      execute: () => {
        throw new Error('store down');
      },
    })({ req: { query: {} } });
    expect(context.activeVersions).toEqual({
      contour: 'test-stand',
      items: [],
    });
    expect(Array.isArray(context.allowedContours)).toBe(true);
  });
});
