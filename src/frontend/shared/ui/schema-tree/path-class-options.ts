export const PATH_CLASS_OPTIONS = [
  { value: 'category', label: 'enum' },
  { value: 'free-text', label: 'string' },
  { value: 'identifier', label: 'identifier' },
  { value: 'pattern', label: 'pattern' },
  { value: 'number-string', label: 'integer' },
  { value: 'datetime:date', label: 'date' },
  { value: 'datetime:date-time', label: 'date-time' },
  { value: 'boolean', label: 'boolean' },
  { value: 'nested', label: 'object' },
  { value: 'array:free-text', label: 'array[string]' },
  { value: 'array:category', label: 'array[enum]' },
  { value: 'array:identifier', label: 'array[identifier]' },
  { value: 'array:number-string', label: 'array[integer]' },
  { value: 'array:datetime:date', label: 'array[date]' },
  { value: 'array:datetime:date-time', label: 'array[date-time]' },
  { value: 'array:boolean', label: 'array[boolean]' },
  { value: 'array:nested', label: 'array[object]' },
  { value: 'open-map', label: 'open-map' },
  { value: 'rejected', label: 'rejected' },
] as const;

export const pathClassSelectValue = (
  pathClass: string,
  datetimeFormat?: string,
  itemPathClass?: string,
  itemDatetimeFormat?: string,
): string => {
  if (pathClass === 'datetime') {
    return datetimeFormat === 'date' ? 'datetime:date' : 'datetime:date-time';
  }
  if (pathClass === 'array') {
    const item = pathClassSelectValue(
      itemPathClass ?? 'free-text',
      itemDatetimeFormat,
    );
    const encoded = item.startsWith('array')
      ? 'array:free-text'
      : `array:${item}`;
    return PATH_CLASS_OPTIONS.some((option) => option.value === encoded)
      ? encoded
      : 'array:free-text';
  }
  return PATH_CLASS_OPTIONS.some((item) => item.value === pathClass)
    ? pathClass
    : 'free-text';
};
