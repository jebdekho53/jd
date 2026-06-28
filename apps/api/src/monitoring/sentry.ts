import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

/** Optional Sentry bootstrap — no-op when SENTRY_DSN is unset. */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/nestjs') as {
      init: (opts: Record<string, unknown>) => void;
    };
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    });
    logger.log('Sentry initialized');
  } catch {
    logger.warn('SENTRY_DSN is set but @sentry/nestjs is not installed — skipping error tracking');
  }
}
