import { randomInt, timingSafeEqual } from 'crypto';

/**
 * Handover OTP configuration. Centralised so the codes, attempt limit and length
 * are not scattered as magic numbers. Overridable via env for ops tuning.
 */
export const HANDOVER_OTP_LENGTH = 4;

export const HANDOVER_OTP_MAX_ATTEMPTS = Number(
  process.env.RIDER_HANDOVER_OTP_MAX_ATTEMPTS ?? 5,
);

/**
 * Generate a numeric handover OTP (default 4 digits) using a CSPRNG.
 * Zero-padded so leading zeros are preserved.
 */
export function generateHandoverOtp(length = HANDOVER_OTP_LENGTH): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, '0');
}

/**
 * Constant-time comparison of a rider-submitted code against the stored code.
 * Length-mismatch short-circuits to false but still runs a fixed compare to
 * avoid trivially leaking length through timing.
 */
export function otpMatches(submitted: string, expected: string | null | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(String(submitted));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Compare against itself to keep the work constant; result forced false.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}
