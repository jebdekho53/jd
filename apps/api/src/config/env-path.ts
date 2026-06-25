import { existsSync } from 'fs';
import { resolve } from 'path';

/** Monorepo root `.env` — API runs from `apps/api` in dev and `apps/api/dist` in prod. */
export function resolveEnvFilePaths(): string[] {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../../../.env'),
    resolve(__dirname, '../../../../.env'),
  ];

  const seen = new Set<string>();
  const paths: string[] = [];
  for (const file of candidates) {
    if (seen.has(file)) continue;
    seen.add(file);
    if (existsSync(file)) paths.push(file);
  }
  return paths;
}
