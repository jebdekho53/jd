import { randomInt } from 'crypto';

/**
 * Cryptographically secure integer in [min, max] (inclusive).
 */
export function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max + 1);
}

/**
 * Cryptographically secure numeric string of exact length (no leading-zero bias for OTP).
 */
export function secureNumericCode(length: number): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(secureRandomInt(min, max));
}
