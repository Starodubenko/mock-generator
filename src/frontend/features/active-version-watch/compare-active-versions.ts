export const ACTIVE_VERSION_NONE = 'нет';
export const ACTIVE_VERSION_STORAGE_PREFIX =
  'mock-generator:active-versions:';

export type ActiveVersionCatalogItem = {
  documentType: string;
  activeVersionId: string | null;
  activeVersionLabel: string | null;
};

export type ActiveVersionCatalog = {
  contour: string;
  items: ActiveVersionCatalogItem[];
  ready: boolean;
};

export type ActiveVersionSnapshotItem = {
  documentType: string;
  title: string;
  versionId: string | null;
  caption: string;
};

export type ActiveVersionSnapshot = {
  contour: string;
  items: ActiveVersionSnapshotItem[];
  ready: boolean;
};

export type ActiveVersionChange = {
  documentType: string;
  title: string;
  was: string;
  became: string;
};

export type ActiveVersionWatchDecision = {
  open: boolean;
  persist: boolean;
  changes: ActiveVersionChange[];
};

export const storageKeyForContour = (contour: string): string =>
  `${ACTIVE_VERSION_STORAGE_PREFIX}${contour}`;

export const toSafeJson = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
};

const readVersionId = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  return value;
};

const readLabel = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  return value;
};

export const parseCatalogPayload = (
  value: unknown,
  fallbackContour: string,
): ActiveVersionCatalog => {
  const record = asRecord(value);
  if (!record) {
    return { contour: fallbackContour, items: [], ready: false };
  }
  const contour =
    typeof record.contour === 'string' && record.contour.trim()
      ? record.contour
      : fallbackContour;
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems.flatMap((entry) => {
    const item = asRecord(entry);
    if (
      !item ||
      typeof item.documentType !== 'string' ||
      !item.documentType.trim()
    ) {
      return [];
    }
    return [
      {
        documentType: item.documentType,
        activeVersionId: readVersionId(item.activeVersionId),
        activeVersionLabel: readLabel(item.activeVersionLabel),
      },
    ];
  });
  return { contour, items, ready: true };
};

export const parseStoredSnapshot = (
  raw: string | null,
): ActiveVersionSnapshotItem[] | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    if (!record || !Array.isArray(record.items)) {
      return null;
    }
    const items = record.items.flatMap((entry) => {
      const item = asRecord(entry);
      if (
        !item ||
        typeof item.documentType !== 'string' ||
        !item.documentType.trim()
      ) {
        return [];
      }
      const versionId = readVersionId(item.versionId);
      const title =
        typeof item.title === 'string' && item.title.trim()
          ? item.title
          : item.documentType;
      const caption =
        typeof item.caption === 'string' && item.caption.trim()
          ? item.caption
          : (versionId ?? ACTIVE_VERSION_NONE);
      return [{ documentType: item.documentType, title, versionId, caption }];
    });
    return items;
  } catch {
    return null;
  }
};

export const serializeSnapshot = (snapshot: ActiveVersionSnapshot): string =>
  JSON.stringify({ contour: snapshot.contour, items: snapshot.items });

export const diffActiveVersions = (
  previous: ActiveVersionSnapshotItem[] | null,
  current: ActiveVersionSnapshotItem[],
): ActiveVersionChange[] => {
  if (previous === null) {
    return [];
  }
  const previousByType = new Map(
    previous.map((item) => [item.documentType, item]),
  );
  const currentTypes = new Set(current.map((item) => item.documentType));
  const changes: ActiveVersionChange[] = [];
  current.forEach((item) => {
    const was = previousByType.get(item.documentType);
    const wasId = was?.versionId ?? null;
    if (wasId === item.versionId) {
      return;
    }
    changes.push({
      documentType: item.documentType,
      title: item.title,
      was: was ? was.caption : ACTIVE_VERSION_NONE,
      became: item.versionId ? item.caption : ACTIVE_VERSION_NONE,
    });
  });
  previous.forEach((was) => {
    if (currentTypes.has(was.documentType) || was.versionId === null) {
      return;
    }
    changes.push({
      documentType: was.documentType,
      title: was.title,
      was: was.caption,
      became: ACTIVE_VERSION_NONE,
    });
  });
  return changes.sort((left, right) =>
    left.title.localeCompare(right.title, 'ru'),
  );
};

export const decideActiveVersionWatch = (
  previous: ActiveVersionSnapshotItem[] | null,
  current: ActiveVersionSnapshotItem[],
  ready: boolean,
): ActiveVersionWatchDecision => {
  if (!ready || current.length === 0) {
    return { open: false, persist: false, changes: [] };
  }
  if (previous === null || previous.length === 0) {
    return { open: false, persist: true, changes: [] };
  }
  const changes = diffActiveVersions(previous, current);
  if (changes.length === 0) {
    return { open: false, persist: true, changes };
  }
  return { open: true, persist: true, changes };
};
