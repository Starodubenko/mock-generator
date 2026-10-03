import type { FC, ReactNode } from 'react';
import { Box, Divider, Link, Paper, Typography } from '@mui/material';
import type { BlockNode, InlineNode } from './parse-markdown';
import { parseMarkdown } from './parse-markdown';

type Props = {
  markdown: string;
};

const renderInline = (nodes: InlineNode[], keyPrefix: string): ReactNode[] =>
  nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.kind === 'strong') {
      return <strong key={key}>{node.text}</strong>;
    }
    if (node.kind === 'em') {
      return <em key={key}>{node.text}</em>;
    }
    if (node.kind === 'code') {
      return (
        <Box
          key={key}
          component="code"
          sx={{
            px: 0.6,
            py: 0.1,
            borderRadius: 0.5,
            bgcolor: 'grey.100',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.85em',
          }}
        >
          {node.text}
        </Box>
      );
    }
    if (node.kind === 'link') {
      return (
        <Link key={key} href={node.href}>
          {node.text}
        </Link>
      );
    }
    return <span key={key}>{node.text}</span>;
  });

const headingVariant = (level: 1 | 2 | 3): 'h5' | 'h6' | 'subtitle1' => {
  if (level === 1) {
    return 'h5';
  }
  if (level === 2) {
    return 'h6';
  }
  return 'subtitle1';
};

const renderBlock = (block: BlockNode, index: number): ReactNode => {
  if (block.kind === 'heading') {
    return (
      <Typography
        key={index}
        variant={headingVariant(block.level)}
        component={block.level === 1 ? 'h2' : 'h3'}
        sx={{
          mt: block.level === 1 ? 0 : 2.5,
          mb: 1,
          fontWeight: 650,
          color: block.level === 2 ? 'primary.dark' : 'text.primary',
        }}
      >
        {renderInline(block.children, `h-${index}`)}
      </Typography>
    );
  }
  if (block.kind === 'paragraph') {
    return (
      <Typography
        key={index}
        variant="body2"
        sx={{ mb: 1.25, color: 'text.secondary', lineHeight: 1.7 }}
      >
        {renderInline(block.children, `p-${index}`)}
      </Typography>
    );
  }
  if (block.kind === 'list') {
    return (
      <Box
        key={index}
        component={block.ordered ? 'ol' : 'ul'}
        sx={{ mt: 0, mb: 1.5, pl: 2.5, color: 'text.secondary' }}
      >
        {block.items.map((item, itemIndex) => (
          <Typography
            key={itemIndex}
            component="li"
            variant="body2"
            sx={{ mb: 0.75, lineHeight: 1.65 }}
          >
            {renderInline(item, `li-${index}-${itemIndex}`)}
          </Typography>
        ))}
      </Box>
    );
  }
  if (block.kind === 'quote') {
    return (
      <Box
        key={index}
        sx={{
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          bgcolor: '#e8f1fb',
          px: 1.5,
          py: 1,
          mb: 1.5,
          borderRadius: '0 8px 8px 0',
        }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
          {renderInline(block.children, `q-${index}`)}
        </Typography>
      </Box>
    );
  }
  if (block.kind === 'fence') {
    return (
      <Paper
        key={index}
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1.5,
          bgcolor: 'grey.50',
          overflow: 'auto',
        }}
      >
        <Box
          component="pre"
          sx={{
            m: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 13,
            whiteSpace: 'pre-wrap',
          }}
        >
          {block.text}
        </Box>
      </Paper>
    );
  }
  return <Divider key={index} sx={{ my: 2 }} />;
};

export const MarkdownView: FC<Props> = (props) => {
  const { markdown } = props;
  return (
    <Box>
      {parseMarkdown(markdown).map((block, index) => renderBlock(block, index))}
    </Box>
  );
};
