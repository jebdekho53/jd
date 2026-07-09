import { ConfigService } from '@nestjs/config';

/**
 * Parse integer env vars safely. `configService.get<number>(key, default)`
 * returns the raw STRING whenever the var is set (env values are always
 * strings), which then breaks Prisma Int operations, the throttler, timeouts,
 * etc. This coerces to a real integer and falls back to the default when the
 * value is missing or non-numeric.
 */
export function envInt(configService: ConfigService, key: string, defaultValue: number): number {
  const raw = configService.get<string | number>(key);
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : defaultValue;
}

/** Same as envInt but allows fractional values (e.g. rates). */
export function envFloat(configService: ConfigService, key: string, defaultValue: number): number {
  const raw = configService.get<string | number>(key);
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : defaultValue;
}
