import type { FC } from 'react';
import type { PageProps } from '@nestjs-ssr/react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { formatDocumentType } from '@frontend/shared/i18n/ru-labels';
import { formatProfileVersionLabel } from '@frontend/shared/i18n/profile-version-label';
import { SectionCard } from '@frontend/shared/ui/section-card';
import { PagePanel } from '@frontend/shared/ui/page-panel';
import { PageWithHelp } from '@frontend/widgets/page-help/ui/PageWithHelp';
import { homeHelp } from '../config/help';

type HomeDocumentType = {
  documentType: string;
  activeVersionId: string | null;
  activeVersionLabel: string | null;
};

export const generateJobHref = (
  contour: string,
  item: HomeDocumentType,
): string => {
  const params = new URLSearchParams({
    contour,
    documentType: item.documentType,
  });
  if (item.activeVersionId) {
    params.set('profileVersionId', item.activeVersionId);
  }
  return `/jobs/new?${params.toString()}`;
};

type Props = PageProps<{
  contours: Array<{ contour: string; timeZone: string }>;
  documentTypes: HomeDocumentType[];
  contour: string;
}>;

export const HomePage: FC<Props> = (props) => {
  const { contours, documentTypes, contour } = props;
  const firstType = documentTypes[0]?.documentType ?? 'document';

  return (
    <PageWithHelp markdown={homeHelp(contour)}>
      <PagePanel lockScroll>
        <Stack
          spacing={1}
          sx={{
            minHeight: 0,
            height: { md: '100%' },
            flex: { md: 1 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="h4" component="h1">
              Пульт оператора
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Контур {contour}. Видны только метаданные — тел документов здесь
              нет.
            </Typography>
          </Box>

          {contours.length === 0 ? (
            <Alert severity="warning" sx={{ flexShrink: 0 }}>
              Список контуров пуст. Публикация запрещена.
            </Alert>
          ) : null}

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap', gap: 1, flexShrink: 0 }}
          >
            <Button
              href={`/profiles/${firstType}?contour=${contour}`}
              variant="contained"
              size="small"
            >
              Обучить профиль
            </Button>
            <Button
              href={`/jobs/new?contour=${contour}`}
              variant="outlined"
              size="small"
            >
              Новое задание генерации
            </Button>
            <Button
              href={`/jobs?contour=${contour}`}
              variant="text"
              size="small"
            >
              Список заданий
            </Button>
          </Stack>

          <SectionCard title="Типы документов" fill>
            {documentTypes.length === 0 ? (
              <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2">
                  Типов ещё нет. Добавьте тип на вкладке типов документов.
                </Typography>
                <Button
                  href={`/document-types?contour=${contour}`}
                  size="small"
                  variant="contained"
                >
                  К типам документов
                </Button>
              </Stack>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                  gap: 2,
                }}
              >
                {documentTypes.map((item) => (
                  <Paper
                    key={item.documentType}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1">
                        {formatDocumentType(item.documentType)}
                      </Typography>
                      {item.activeVersionId ? (
                        <Chip
                          size="small"
                          color="success"
                          label={formatProfileVersionLabel({
                            versionId: item.activeVersionId,
                            label: item.activeVersionLabel,
                          })}
                        />
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="нет текущей версии"
                        />
                      )}
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: 'wrap', gap: 1 }}
                      >
                        <Button
                          size="small"
                          href={`/profiles/${item.documentType}?contour=${contour}`}
                        >
                          Обучить
                        </Button>
                        <Button
                          size="small"
                          href={`/document-types?contour=${contour}&open=${encodeURIComponent(item.documentType)}`}
                        >
                          Профили
                        </Button>
                        <Button
                          size="small"
                          variant={item.activeVersionId ? 'contained' : 'text'}
                          href={generateJobHref(contour, item)}
                        >
                          Сгенерировать
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </SectionCard>
        </Stack>
      </PagePanel>
    </PageWithHelp>
  );
};

HomePage.displayName = 'HomePage';

export default HomePage;
