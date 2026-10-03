const FORBIDDEN = ['Bearer', 'INDEXER_BASE_URL'];

export const assertOperatorHelpSafe = (markdown: string): void => {
  expect(markdown.length).toBeGreaterThan(280);
  expect(parseMarkdownHasHeading(markdown)).toBe(true);
  FORBIDDEN.forEach((fragment) => {
    expect(markdown).not.toContain(fragment);
  });
};

const parseMarkdownHasHeading = (markdown: string): boolean =>
  /^#\s+/m.test(markdown);
