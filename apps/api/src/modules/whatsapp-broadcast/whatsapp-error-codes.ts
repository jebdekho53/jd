/**
 * Meta Cloud API error triage. Three outcomes matter for a batch send:
 *
 * - `retry`    — transient (throttling, Meta 5xx). Back off and try again.
 * - `fail`     — permanent for this recipient only (bad number, closed window).
 *                Record it and move on to the next recipient.
 * - `abort`    — fatal for the whole batch (token expired, account restricted).
 *                Continuing would just burn through the list producing failures.
 *
 * Codes: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
 */
export type SendOutcome = 'retry' | 'fail' | 'abort';

/** Rate limiting and temporary Meta-side problems. */
const RETRYABLE_CODES = new Set([
  4, // Application request limit reached
  80007, // Rate limit hit
  130429, // Cloud API message throughput limit
  131048, // Spam rate limit hit
  131056, // Pair rate limit (too many messages to this number)
  133016, // Temporarily blocked for throughput
  1, // Unknown/transient API error
  2, // Temporary service unavailability
]);

/** Problems with the credentials or the WhatsApp Business Account itself. */
const FATAL_CODES = new Set([
  190, // Access token expired / invalidated
  200, // Permission denied
  10, // Application does not have permission
  131031, // Business account has been restricted
  368, // Temporarily blocked for policy violations
]);

export function classifySendError(errorCode?: number, httpStatus?: number): SendOutcome {
  if (errorCode !== undefined) {
    if (FATAL_CODES.has(errorCode)) return 'abort';
    if (RETRYABLE_CODES.has(errorCode)) return 'retry';
    // Everything else with a Meta code is a permanent problem with this one
    // recipient — e.g. 131026 undeliverable, 131047 outside the 24h window,
    // 132001 template does not exist, 132000 wrong number of variables.
    return 'fail';
  }

  // No Meta code: fall back to transport-level signals (timeouts, gateway errors).
  if (httpStatus === undefined) return 'retry';
  if (httpStatus === 429 || httpStatus >= 500) return 'retry';
  if (httpStatus === 401 || httpStatus === 403) return 'abort';
  return 'fail';
}
