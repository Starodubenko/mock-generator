import type { FC } from 'react';
import type { LayoutProps } from '@nestjs-ssr/react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ruRU } from '@mui/material/locale';
import { AppChrome } from '@frontend/app/ui/AppChrome';

const theme = createTheme(
  {
    palette: {
      background: { default: '#f4f6f8' },
    },
    shape: { borderRadius: 10 },
  },
  ruRU,
);

const readAllowedContours = (context: LayoutProps['context']): string[] => {
  if (
    !context ||
    typeof context !== 'object' ||
    !('allowedContours' in context)
  ) {
    return [];
  }
  const raw = (
    context as LayoutProps['context'] & { allowedContours?: unknown }
  ).allowedContours;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (item): item is string => typeof item === 'string' && Boolean(item),
  );
};

const readActiveCatalog = (context: LayoutProps['context']): unknown => {
  if (
    !context ||
    typeof context !== 'object' ||
    !('activeVersions' in context)
  ) {
    return null;
  }
  return (context as LayoutProps['context'] & { activeVersions?: unknown })
    .activeVersions;
};

export const ConsoleLayout: FC<LayoutProps> = (props) => {
  const { children, context } = props;
  const contour =
    typeof context?.query?.contour === 'string'
      ? context.query.contour
      : 'test-stand';
  const currentPath = typeof context?.path === 'string' ? context.path : '/';
  const toast =
    typeof context?.query?.toast === 'string' ? context.query.toast : null;
  const sharePath =
    typeof context?.query?.sharePath === 'string'
      ? context.query.sharePath
      : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppChrome
        contour={contour}
        contours={readAllowedContours(context)}
        currentPath={currentPath}
        toast={toast}
        sharePath={sharePath}
        activeCatalog={readActiveCatalog(context)}
      >
        {children}
      </AppChrome>
    </ThemeProvider>
  );
};

ConsoleLayout.displayName = 'ConsoleLayout';

export default ConsoleLayout;
