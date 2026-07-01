export const HSN_CODE_REGEX = /^\d{4}(\d{2}){0,2}$/;

export function normalizeHsnCode(value?: string | null): string {
  return value?.trim() ?? '';
}

export function isValidHsnCode(value: string): boolean {
  return HSN_CODE_REGEX.test(value);
}
