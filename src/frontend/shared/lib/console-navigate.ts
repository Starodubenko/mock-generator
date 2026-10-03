type ClientNavigate = {
  navigate: (
    href: string,
    options: { replace: boolean; scroll: boolean },
  ) => void;
};

const asClientNavigate = (mod: unknown): ClientNavigate['navigate'] | null => {
  if (typeof mod !== 'object' || mod === null || !('navigate' in mod)) {
    return null;
  }
  const navigate = (mod as { navigate?: unknown }).navigate;
  return typeof navigate === 'function'
    ? (navigate as ClientNavigate['navigate'])
    : null;
};

export const consoleNavigate = (href: string): void => {
  void import('@nestjs-ssr/react/client')
    .then((mod: unknown) => {
      const navigate = asClientNavigate(mod);
      if (navigate) {
        navigate(href, { replace: true, scroll: false });
        return;
      }
      window.location.assign(href);
    })
    .catch(() => {
      window.location.assign(href);
    });
};
