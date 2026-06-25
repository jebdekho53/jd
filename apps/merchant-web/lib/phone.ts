const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10 && INDIAN_MOBILE.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (input.startsWith('+91') && input.length === 13) {
    return input;
  }
  return input;
}

export function isValidIndianPhone(input: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(normalizeIndianPhone(input));
}

/** Internal placeholder phones assigned during email-only signup (+910000xxxxxxx). */
export function isPlaceholderPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return /^\+910000\d{7}$/.test(phone);
}

export function formatPhoneDisplay(phone: string): string {
  if (isPlaceholderPhone(phone)) return '';
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
