export const nameJobFromHref = (href: string): string | null => {
  try {
    return new URL(href, 'http://console.local').searchParams.get('nameJob');
  } catch {
    return null;
  }
};
