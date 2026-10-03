export const swaggerTypeLabel = (
  pathClass: string,
  datetimeFormat?: string,
): string => {
  if (pathClass === 'boolean') {
    return 'boolean';
  }
  if (pathClass === 'number-string') {
    return 'integer';
  }
  if (pathClass === 'datetime') {
    return datetimeFormat === 'date' ? 'date' : 'date-time';
  }
  if (pathClass === 'nested' || pathClass === 'open-map') {
    return 'object';
  }
  if (pathClass === 'array') {
    return 'array';
  }
  if (pathClass === 'rejected') {
    return 'rejected';
  }
  return 'string';
};

export const swaggerTypeColor = (label: string): string => {
  if (label === 'boolean') {
    return '#9b59b6';
  }
  if (label === 'integer') {
    return '#1a73e8';
  }
  if (label === 'date' || label === 'date-time') {
    return '#16a085';
  }
  if (label === 'object') {
    return '#6b7280';
  }
  if (label === 'array' || label.startsWith('array[')) {
    return '#e67e22';
  }
  if (label === 'rejected') {
    return '#d32f2f';
  }
  if (label === 'null') {
    return '#6b7280';
  }
  return '#55a538';
};

export const formatTypeVariants = (input: {
  pathClass: string;
  datetimeFormat?: string;
  itemPathClass?: string;
  itemDatetimeFormat?: string;
  typeVariants?: string[];
  nullRate?: number;
}): string[] => {
  if (input.typeVariants && input.typeVariants.length > 0) {
    return input.typeVariants;
  }
  if (input.pathClass === 'array') {
    const label = input.itemPathClass
      ? `array[${swaggerTypeLabel(input.itemPathClass, input.itemDatetimeFormat)}]`
      : 'array';
    return input.nullRate && input.nullRate > 0 ? [label, 'null'] : [label];
  }
  const label = swaggerTypeLabel(input.pathClass, input.datetimeFormat);
  return input.nullRate && input.nullRate > 0 ? [label, 'null'] : [label];
};

export const isSchemaObject = (
  pathClass: string,
  childCount: number,
): boolean =>
  childCount > 0 || pathClass === 'nested' || pathClass === 'open-map';

export const isCollapsibleNode = (
  pathClass: string,
  childCount: number,
  itemPathClass?: string,
): boolean =>
  (pathClass === 'array' && (childCount > 0 || itemPathClass === 'nested')) ||
  isSchemaObject(pathClass, childCount);
