export const withToast = (path: string, toast: string): string => {
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}toast=${encodeURIComponent(toast)}`;
};
