import { BACKOFF } from '../ai-catalog.constants';

/**
 * Jittered exponential backoff. delay = min(base * 2^(attempt-1), max), then a
 * uniform random jitter of up to ±jitterRatio is applied so a burst of jobs
 * that fail together (e.g. provider outage) don't all retry in lockstep and
 * hammer the provider ("thundering herd").
 */
export function jitteredExponentialBackoff(attemptsMade: number): number {
  const attempt = Math.max(1, attemptsMade);
  const raw = BACKOFF.baseMs * Math.pow(2, attempt - 1);
  const capped = Math.min(raw, BACKOFF.maxMs);
  const jitter = capped * BACKOFF.jitterRatio * (Math.random() * 2 - 1);
  return Math.max(BACKOFF.baseMs, Math.round(capped + jitter));
}

/** BullMQ WorkerOptions.settings.backoffStrategy signature. */
export const backoffStrategy = (attemptsMade: number): number =>
  jitteredExponentialBackoff(attemptsMade);
