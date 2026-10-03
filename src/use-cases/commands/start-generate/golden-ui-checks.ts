import { localCalendarDay } from '@entities/config/calendar-day';
import type { FieldConstraint } from '@entities/job/field-constraint';
import type { OpenSearchIndexPort } from '@repositories/opensearch-index.port';

export const GOLDEN_UI_STATUSES = ['NEW', 'PENDING', 'ERROR', 'DONE'] as const;

export const GOLDEN_UI_MESSAGE_TYPES = ['type-a', 'type-b'] as const;

export { localCalendarDay };

const categoryAllowList = (
  constraints: FieldConstraint[] | undefined,
  path: string,
): string[] | undefined => {
  const found = constraints?.find(
    (item) => item.path === path && item.kind === 'category',
  );
  return found?.kind === 'category' ? found.values : undefined;
};

export const effectiveGoldenValues = (
  defaults: readonly string[],
  constraints: FieldConstraint[] | undefined,
  path: string,
): string[] => {
  const allow = categoryAllowList(constraints, path);
  if (!allow?.length) {
    return [...defaults];
  }
  const intersection = defaults.filter((item) => allow.includes(item));
  return intersection.length > 0 ? intersection : [...allow];
};

export const runGoldenUiChecks = async (
  indexPort: OpenSearchIndexPort,
  contour: string,
  index: string,
  generatedAt: string,
  zone: string,
  documentCount: number,
  firstId?: string,
  constraints?: FieldConstraint[],
): Promise<boolean> => {
  if (firstId) {
    const byId = await indexPort.search({
      contour,
      index,
      body: { filters: { id: firstId } },
    });
    if (byId.total < 1) {
      return false;
    }
  }
  const statuses = effectiveGoldenValues(
    GOLDEN_UI_STATUSES,
    constraints,
    'status',
  );
  const statusChecks = Math.min(documentCount, statuses.length);
  for (const status of statuses.slice(0, statusChecks)) {
    const byStatus = await indexPort.search({
      contour,
      index,
      body: { filters: { status, goldenDay: generatedAt, zone } },
    });
    if (byStatus.total < 1) {
      return false;
    }
  }
  const messageTypes = effectiveGoldenValues(
    GOLDEN_UI_MESSAGE_TYPES,
    constraints,
    'messageType',
  );
  const typeChecks = Math.min(documentCount, messageTypes.length);
  for (const messageType of messageTypes.slice(0, typeChecks)) {
    const byType = await indexPort.search({
      contour,
      index,
      body: { filters: { messageType, goldenDay: generatedAt, zone } },
    });
    if (byType.total < 1) {
      return false;
    }
  }
  const uiToday = await indexPort.search({
    contour,
    index,
    body: { filters: { goldenUiToday: true, goldenDay: generatedAt, zone } },
  });
  return uiToday.total >= 1;
};
