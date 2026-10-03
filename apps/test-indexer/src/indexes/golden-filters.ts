export type GoldenFilters = {
  id?: string;
  status?: string;
  messageType?: string;
  goldenDay?: string;
  zone?: string;
  goldenUiToday?: boolean;
};

export const localCalendarDay = (iso: string): string => {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? iso.slice(0, 10);
};

export const asGoldenFilters = (body: Record<string, unknown> | undefined): GoldenFilters | null => {
  const filters = body?.filters;
  if (filters === null || filters === undefined || typeof filters !== 'object' || Array.isArray(filters)) {
    return null;
  }
  return filters as GoldenFilters;
};

export const goldenFiltersToQuery = (filters: GoldenFilters): Record<string, unknown> => {
  const must: Record<string, unknown>[] = [];
  if (filters.id) {
    must.push({ term: { id: filters.id } });
  }
  if (filters.status) {
    must.push({ term: { status: filters.status } });
  }
  if (filters.messageType) {
    must.push({ term: { messageType: filters.messageType } });
  }
  const day = filters.goldenDay ? localCalendarDay(filters.goldenDay) : null;
  if (day) {
    must.push({
      range: {
        creationDateTime: {
          gte: `${day}T00:00:00`,
          lte: `${day}T23:59:59.999`,
        },
      },
    });
  }
  if (filters.goldenUiToday) {
    must.push({ exists: { field: 'status' } });
    must.push({ exists: { field: 'creationDateTime' } });
  }
  return must.length === 0 ? { match_all: {} } : { bool: { must } };
};
