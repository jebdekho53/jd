/** Indian GSTIN: 15 chars — state(2) + PAN(10) + entity(1) + Z + checksum */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(gstin: string | null | undefined): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export function gstinStateCode(gstin: string | null | undefined): string | null {
  if (!isValidGstin(gstin)) return null;
  return gstin!.trim().slice(0, 2);
}

export function normalizeGstin(gstin: string): string {
  return gstin.trim().toUpperCase();
}
