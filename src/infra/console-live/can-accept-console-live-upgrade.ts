export const canAcceptConsoleLiveUpgrade = (
  cookieHeader: string | undefined,
  sessionRequired: boolean,
): boolean => {
  if (!sessionRequired) {
    return true;
  }
  return (cookieHeader ?? '').includes('console_session=');
};
