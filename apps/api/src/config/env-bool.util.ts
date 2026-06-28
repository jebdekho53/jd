import { ConfigService } from '@nestjs/config';

/** Parse boolean env vars (`true` / `1` / `false` / `0`). */
export function envBool(configService: ConfigService, key: string, defaultValue: boolean): boolean {
  const raw = configService.get<string>(key);
  if (raw === undefined || raw === '') return defaultValue;
  return raw === 'true' || raw === '1';
}
