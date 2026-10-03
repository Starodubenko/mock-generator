import type { FC, ReactNode } from 'react';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { ConsoleToastHost } from '@frontend/features/action-toast/console-toast-host';
import { ActiveVersionWatch } from '@frontend/features/active-version-watch/active-version-watch';
import { mapCatalogToSnapshot } from '@frontend/features/active-version-watch/map-active-version-snapshot';
import { parseCatalogPayload } from '@frontend/features/active-version-watch/compare-active-versions';
import { FIELD_HINTS } from '@frontend/shared/i18n/field-hints';
import { FieldHint } from '@frontend/shared/ui/field-hint/field-hint';
import { KitSelect } from '@frontend/shared/ui/kit-select/kit-select';
import { ConsoleNav } from '@frontend/widgets/console-nav/ui/ConsoleNav';

type Props = {
  contour: string;
  contours: string[];
  currentPath: string;
  toast: string | null;
  sharePath?: string | null;
  activeCatalog?: unknown;
  children: ReactNode;
};

export const uniqueContours = (
  contours: string[],
  current: string,
): string[] => [...new Set([...contours, current].filter(Boolean))];

export const AppChrome: FC<Props> = (props) => {
  const {
    contour,
    contours,
    currentPath,
    toast,
    sharePath = null,
    activeCatalog,
    children,
  } = props;
  const options = uniqueContours(contours, contour);
  const snapshot = mapCatalogToSnapshot(
    parseCatalogPayload(activeCatalog, contour),
  );

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: { md: '100dvh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: { xs: 'auto', md: 'hidden' },
        bgcolor: 'background.default',
      }}
    >
      <AppBar position="static" elevation={0} sx={{ flexShrink: 0 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Генератор синтетических данных
          </Typography>
          <Box
            component="form"
            method="get"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Typography
              component="label"
              htmlFor="contour-select"
              variant="body2"
            >
              Контур
            </Typography>
            <FieldHint text={FIELD_HINTS.contour} tone="onPrimary" />
            <KitSelect
              id="contour-select"
              name="contour"
              defaultValue={contour}
              variant="appbar"
              fullWidth={false}
              aria-label="Контур"
              submitOnChange
              options={options.map((item) => ({ value: item, label: item }))}
            />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          width: 1,
          maxWidth: 'none',
          px: { xs: 2, md: 3 },
          py: 1,
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <ConsoleNav contour={contour} currentPath={currentPath} />
        </Box>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: { xs: 'visible', md: 'hidden' },
            display: { md: 'flex' },
            flexDirection: { md: 'column' },
            '& > *': {
              flex: { md: 1 },
              minHeight: { md: 0 },
              height: { md: '100%' },
              minWidth: 0,
            },
          }}
        >
          {children}
        </Box>
      </Box>
      <ActiveVersionWatch key={snapshot.contour} snapshot={snapshot} />
      <ConsoleToastHost toast={toast} sharePath={sharePath} />
    </Box>
  );
};
