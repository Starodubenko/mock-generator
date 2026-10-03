import type { FC } from 'react';
import { Box, Button, Chip, Link, Stack, Typography } from '@mui/material';
import { mockMethodTone } from '../config/method-tone';

export type SwaggerOperationRow = {
  method: string;
  path: string;
  group: string;
  summary: string;
  hasBody: boolean;
  shareUrl: string;
  publicUrl: string;
};

type Props = {
  item: SwaggerOperationRow;
  confirmHref: string;
  open: boolean;
};

export const SwaggerOperation: FC<Props> = (props) => {
  const { item, confirmHref, open } = props;
  const tone = mockMethodTone(item.method);
  return (
    <Box
      component="details"
      open={open}
      data-swagger-op=""
      sx={{
        border: '1px solid',
        borderColor: tone,
        borderRadius: 1,
        bgcolor: `${tone}14`,
        overflow: 'hidden',
      }}
    >
      <Box
        component="summary"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          listStyle: 'none',
          '&::-webkit-details-marker': { display: 'none' },
        }}
      >
        <Box
          sx={{
            width: 88,
            py: 1,
            textAlign: 'center',
            bgcolor: tone,
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 0.4,
          }}
        >
          {item.method}
        </Box>
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, flex: 1 }}>
          {item.path}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ pr: 1 }}>
          {item.summary}
        </Typography>
        <Chip
          size="small"
          label={item.hasBody ? 'есть ответ' : 'нет ответа'}
          sx={{ mr: 1 }}
        />
      </Box>
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Stack spacing={1.5}>
          <Link
            href={item.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            data-share-preview=""
            sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
          >
            {item.publicUrl}
          </Link>
          {item.shareUrl && item.shareUrl !== item.publicUrl ? (
            <Link
              href={item.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
            >
              {item.shareUrl}
            </Link>
          ) : null}
          <Stack direction="row" spacing={1}>
            <Button href={confirmHref} size="small" color="error">
              Удалить
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

SwaggerOperation.displayName = 'SwaggerOperation';
