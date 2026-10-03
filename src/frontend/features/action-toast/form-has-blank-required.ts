export const formHasBlankRequired = (form: HTMLFormElement): boolean =>
  Array.from(form.elements).some((el) => {
    if (
      !(el instanceof HTMLInputElement) &&
      !(el instanceof HTMLTextAreaElement) &&
      !(el instanceof HTMLSelectElement)
    ) {
      return false;
    }
    return Boolean(el.required) && !String(el.value ?? '').trim();
  });
