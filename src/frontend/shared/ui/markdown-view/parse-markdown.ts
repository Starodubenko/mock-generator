export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'em'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; text: string; href: string };

export type BlockNode =
  | { kind: 'heading'; level: 1 | 2 | 3; children: InlineNode[] }
  | { kind: 'paragraph'; children: InlineNode[] }
  | { kind: 'list'; ordered: boolean; items: InlineNode[][] }
  | { kind: 'quote'; children: InlineNode[] }
  | { kind: 'fence'; text: string }
  | { kind: 'rule' };

export const safeHelpHref = (href: string): string => {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }
  if (href.startsWith('#')) {
    return href;
  }
  return '';
};

export const parseInline = (source: string): InlineNode[] => {
  const nodes: InlineNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\))/g;
  let lastIndex = 0;
  let match = pattern.exec(source);
  while (match) {
    if (match.index > lastIndex) {
      nodes.push({ kind: 'text', text: source.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push({ kind: 'strong', text: token.slice(2, -2) });
    } else if (token.startsWith('*')) {
      nodes.push({ kind: 'em', text: token.slice(1, -1) });
    } else if (token.startsWith('`')) {
      nodes.push({ kind: 'code', text: token.slice(1, -1) });
    } else {
      const link = token.match(/^\[([^\]]+)]\(([^)]+)\)$/);
      if (link) {
        const href = safeHelpHref(link[2]);
        if (href) {
          nodes.push({ kind: 'link', text: link[1], href });
        } else {
          nodes.push({ kind: 'text', text: link[1] });
        }
      }
    }
    lastIndex = pattern.lastIndex;
    match = pattern.exec(source);
  }
  if (lastIndex < source.length) {
    nodes.push({ kind: 'text', text: source.slice(lastIndex) });
  }
  return nodes.filter(
    (node) => node.kind === 'link' || node.kind === 'code' || node.text !== '',
  );
};

export const parseMarkdown = (source: string): BlockNode[] => {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: BlockNode[] = [];
  let index = 0;

  const flushParagraph = (buffer: string[]): void => {
    const text = buffer.join(' ').trim();
    if (text) {
      blocks.push({ kind: 'paragraph', children: parseInline(text) });
    }
    buffer.length = 0;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') {
      index += 1;
      continue;
    }
    if (line.startsWith('```')) {
      index += 1;
      const body: string[] = [];
      while (index < lines.length && !lines[index].startsWith('```')) {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ kind: 'fence', text: body.join('\n') });
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push({ kind: 'rule' });
      index += 1;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        children: parseInline(heading[2].trim()),
      });
      index += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      const quoted: string[] = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quoted.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push({ kind: 'quote', children: parseInline(quoted.join(' ')) });
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const items: InlineNode[][] = [];
      while (index < lines.length) {
        const itemMatch = isOrdered
          ? lines[index].match(/^\d+\.\s+(.+)$/)
          : lines[index].match(/^[-*]\s+(.+)$/);
        if (!itemMatch) {
          break;
        }
        items.push(parseInline(itemMatch[1]));
        index += 1;
      }
      blocks.push({ kind: 'list', ordered: isOrdered, items });
      continue;
    }
    const paragraph: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !lines[index].startsWith('#') &&
      !lines[index].startsWith('> ') &&
      !lines[index].startsWith('```') &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index]) &&
      !/^---+$/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    flushParagraph(paragraph);
  }
  return blocks;
};
