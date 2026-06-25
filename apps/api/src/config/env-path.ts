import { existsSync } from 'fs';
import { resolve } from 'path';

/** Monorepo root env files — API runs from repo root in prod (PM2 cwd). */
export function resolveEnvFilePaths(): string[] {
  const isProd = process.env.NODE_ENV === 'production';
  const candidates = [
    ...(isProd
      ? [
          resolve(process.cwd(), '.env.production'),
          resolve(process.cwd(), '../../.env.production'),
          resolve(__dirname, '../../.env.production'),
          resolve(__dirname, '../../../.env.production'),
          resolve(__dirname, '../../../../.env.production'),
          resolve(__dirname, '../../../../../.env.production'),
        ]
      : []),
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
