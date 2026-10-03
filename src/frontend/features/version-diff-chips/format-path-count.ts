const plural = (count: number, one: string, few: string, many: string): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
};

export const formatPathCount = (count: number): string => String(count);

export const formatFieldPhrase = (count: number): string =>
  `${count} ${plural(count, 'поле', 'поля', 'полей')}`;
