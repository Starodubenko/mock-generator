export type ProfileVersionCaption = {
  versionId: string;
  label?: string | null;
  active?: boolean;
};

export const formatProfileVersionLabel = (
  item: ProfileVersionCaption,
): string => {
  const name = item.label?.trim()
    ? `${item.versionId} — ${item.label.trim()}`
    : item.versionId;
  return item.active ? `${name} (активна)` : name;
};
