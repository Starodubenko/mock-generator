import type { FC } from 'react';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { MarkdownView } from '@frontend/shared/ui/markdown-view/markdown-view';

type Props = {
  markdown: string;
};

export const PageHelp: FC<Props> = (props) => {
  const { markdown } = props;
  return (
    <Paper
      component="aside"
      variant="outlined"
      aria-label="Инструкция"
      sx={{
        p: 2.5,
        bgcolor: '#f7f9fc',
        minHeight: 0,
        height: { md: '100%' },
        maxHeight: { md: '100%' },
        overflow: 'auto',
        overscrollBehavior: 'contain',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <MenuBookOutlined color="primary" fontSize="small" />
        <Box>
          <Typography
            variant="overline"
            color="primary"
            sx={{ letterSpacing: 1, display: 'block', lineHeight: 1.2 }}
          >
            Инструкция
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Как пользоваться этим экраном
          </Typography>
        </Box>
      </Stack>
      <MarkdownView markdown={markdown} />
    </Paper>
  );
};
