export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T/;

export const localCalendarDay = (iso: string, zone: string): string => {
  const parsed = new Date(iso);
  if (!Number.isNaN(parsed.getTime()) && zone) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(parsed);
    const year = parts.find((item) => item.type === 'year')?.value;
    const month = parts.find((item) => item.type === 'month')?.value;
    const day = parts.find((item) => item.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  }
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? iso.slice(0, 10);
};

export const existingLocalDateTime = (iso: string, zone: string): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return formatGeneratedAt(parsed, zone);
};

const part = (
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string => parts.find((item) => item.type === type)?.value ?? '';

const offsetFromGmt = (gmt: string): string => {
  const raw = gmt.replace(/^GMT/i, '').replace(/^UTC/i, '');
  if (!raw || raw === 'Z') {
    return '+00:00';
  }
  if (/^[+-]\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }
  if (/^[+-]\d{2}$/.test(raw)) {
    return `${raw}:00`;
  }
  if (/^[+-]\d$/.test(raw)) {
    return `${raw[0]}0${raw.slice(1)}:00`;
  }
  return '+00:00';
};

export const formatGeneratedAt = (at: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).formatToParts(at);
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}T${part(parts, 'hour')}:${part(parts, 'minute')}:${part(parts, 'second')}${offsetFromGmt(part(parts, 'timeZoneName'))}`;
};
