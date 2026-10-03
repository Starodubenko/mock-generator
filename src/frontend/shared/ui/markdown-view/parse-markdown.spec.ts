import { parseInline, parseMarkdown, safeHelpHref } from './parse-markdown';

describe('parseMarkdown', () => {
  it('should_parse_headings_lists_and_inline', () => {
    const blocks = parseMarkdown(`# Заголовок

Это **важно** и \`код\`.

- один
- два

1. шаг
`);
    expect(blocks[0]).toMatchObject({ kind: 'heading', level: 1 });
    expect(
      blocks.some((block) => block.kind === 'list' && block.ordered === false),
    ).toBe(true);
    expect(
      blocks.some((block) => block.kind === 'list' && block.ordered === true),
    ).toBe(true);
    expect(
      parseInline('ссылка [Главная](/?contour=test-stand)')[1],
    ).toMatchObject({
      kind: 'link',
      href: '/?contour=test-stand',
    });
  });

  it('should_drop_external_links', () => {
    expect(safeHelpHref('https://example.com')).toBe('');
    expect(safeHelpHref('/jobs')).toBe('/jobs');
  });
});
