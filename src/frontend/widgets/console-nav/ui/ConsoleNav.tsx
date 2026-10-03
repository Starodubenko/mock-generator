import type { FC } from 'react';
import { Button, Paper, Stack } from '@mui/material';

type Props = {
  contour: string;
  currentPath: string;
};

export const isNavActive = (currentPath: string, itemId: string): boolean => {
  if (itemId === 'home') {
    return currentPath === '/' || currentPath === '';
  }
  if (itemId === 'train') {
    return (
      currentPath.startsWith('/profiles') && !currentPath.includes('/versions')
    );
  }
  if (itemId === 'types') {
    return (
      currentPath.startsWith('/document-types') ||
      currentPath.includes('/versions')
    );
  }
  if (itemId === 'mocks') {
    return currentPath === '/mocks' || currentPath.startsWith('/mocks/');
  }
  if (itemId === 'generate') {
    return currentPath === '/jobs/new' || currentPath.startsWith('/jobs/new/');
  }
  if (itemId === 'jobs') {
    return (
      currentPath.startsWith('/jobs') && !currentPath.startsWith('/jobs/new')
    );
  }
  return false;
};

export const ConsoleNav: FC<Props> = (props) => {
  const { contour, currentPath } = props;
  const items = [
    { id: 'home', href: `/?contour=${contour}`, label: 'Главная' },
    {
      id: 'train',
      href: `/profiles/document?contour=${contour}`,
      label: 'Обучение',
    },
    {
      id: 'types',
      href: `/document-types?contour=${contour}`,
      label: 'Типы документов',
    },
    { id: 'jobs', href: `/jobs?contour=${contour}`, label: 'Задания' },
    {
      id: 'generate',
      href: `/jobs/new?contour=${contour}`,
      label: 'Генерация',
    },
    { id: 'mocks', href: `/mocks?contour=${contour}`, label: 'Моки' },
  ];

  return (
    <Paper
      component="nav"
      variant="outlined"
      aria-label="Разделы пульта"
      sx={{ mb: 0, width: 1, px: 1, py: 1 }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ width: 1, flexWrap: 'wrap' }}
      >
        {items.map((item) => (
          <Button
            key={item.id}
            href={item.href}
            size="small"
            variant={isNavActive(currentPath, item.id) ? 'contained' : 'text'}
            sx={{ flex: '0 1 auto', whiteSpace: 'nowrap' }}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
};
