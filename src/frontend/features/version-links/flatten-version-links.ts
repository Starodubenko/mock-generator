export type VersionLinkRow = {
  kind: 'parent-child' | 'equality' | 'date-order' | 'cross-type';
  parentPath?: string;
  childPath?: string;
  arrayPath?: string;
  scope?: string;
  paths?: string[];
  earlierPath?: string;
  laterPath?: string;
  localPath?: string;
  remoteDocumentType?: string;
  remoteField?: string;
};

export type VersionLinkFields = {
  parentChildInvariants?: Array<{
    parentPath: string;
    childPath: string;
    arrayPath: string;
  }>;
  valueEqualities?: Array<{
    scope: 'document' | 'array-item';
    arrayPath?: string;
    paths: string[];
  }>;
  dateOrderInvariants?: Array<{ earlierPath: string; laterPath: string }>;
  crossTypeLinks?: Array<{
    localPath: string;
    remoteDocumentType: string;
    remoteField: string;
  }>;
};

export const flattenVersionLinks = (
  fields: VersionLinkFields,
): VersionLinkRow[] => {
  const rows: VersionLinkRow[] = [];
  for (const item of fields.parentChildInvariants ?? []) {
    rows.push({
      kind: 'parent-child',
      parentPath: item.parentPath,
      childPath: item.childPath,
      arrayPath: item.arrayPath,
    });
  }
  for (const item of fields.valueEqualities ?? []) {
    rows.push({
      kind: 'equality',
      scope: item.scope,
      arrayPath: item.arrayPath,
      paths: item.paths,
    });
  }
  for (const item of fields.dateOrderInvariants ?? []) {
    rows.push({
      kind: 'date-order',
      earlierPath: item.earlierPath,
      laterPath: item.laterPath,
    });
  }
  for (const item of fields.crossTypeLinks ?? []) {
    rows.push({
      kind: 'cross-type',
      localPath: item.localPath,
      remoteDocumentType: item.remoteDocumentType,
      remoteField: item.remoteField,
    });
  }
  return rows;
};

export const linkKindLabel = (kind: VersionLinkRow['kind']): string => {
  if (kind === 'parent-child') {
    return 'родитель → ребёнок';
  }
  if (kind === 'equality') {
    return 'одно значение';
  }
  if (kind === 'date-order') {
    return 'порядок дат';
  }
  return 'другой тип';
};

export const linkKindHint = (kind: VersionLinkRow['kind']): string => {
  if (kind === 'parent-child') {
    return 'Идентификатор документа копируется в поле каждого элемента массива. Синтезатор ставит туда тот же идентификатор, что у самого документа. Это совпадение путей, не расчёт.';
  }
  if (kind === 'equality') {
    return 'Несколько путей получают одно сгенерированное значение. Область «документ» — во всём документе, «элемент массива» — внутри одной строки. Значение считается из задания и номера, эталон не копируется.';
  }
  if (kind === 'date-order') {
    return 'Две даты в одном документе идут в заданном порядке: левая не позже правой. Синтезатор сдвигает даты относительно момента запуска, но сохраняет этот порядок.';
  }
  return 'Поле этого документа ссылается на поле другого типа в том же задании. Синтезатор подставляет идентификатор уже порождённого документа того типа. Если связанный тип ещё не создан, генерация отклоняется.';
};

export const LINK_ADD_KIND_HINT =
  'Вид задаёт, как синтезатор связывает поля. Родитель → ребёнок: идентификатор документа копируется в поле элемента массива. Одно значение: несколько путей получают одинаковое значение. Порядок дат: более ранняя не позже более поздней. Другой тип: поле ссылается на документ другого типа в том же задании.';

export const linkScopeLabel = (row: VersionLinkRow): string => {
  if (row.kind === 'parent-child' || row.scope === 'array-item') {
    return row.arrayPath ?? 'элемент массива';
  }
  if (row.kind === 'cross-type') {
    return row.remoteDocumentType ?? '';
  }
  return 'документ';
};

export const linkPathsLabel = (row: VersionLinkRow): string => {
  if (row.kind === 'parent-child') {
    return `${row.parentPath} → ${row.arrayPath}.${row.childPath}`;
  }
  if (row.kind === 'equality') {
    return (row.paths ?? []).join(', ');
  }
  if (row.kind === 'date-order') {
    return `${row.earlierPath} ≤ ${row.laterPath}`;
  }
  return `${row.localPath} → ${row.remoteDocumentType}.${row.remoteField}`;
};
