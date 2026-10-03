export const formatContourDateTime = (
  iso: string,
  timeZone: string,
): string => {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return '';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: timeZone || 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(ms));
};
