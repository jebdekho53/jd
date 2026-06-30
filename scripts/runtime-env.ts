import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export type RuntimeEnvLoadResult = {
  filesLoaded: string[];
  filesMissing: string[];
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

export function loadRuntimeEnv(): RuntimeEnvLoadResult {
  const candidates = [join(repoRoot, '.env.production'), join(repoRoot, '.env')];
  const filesLoaded: string[] = [];
  const filesMissing: string[] = [];

  for (const file of candidates) {
    if (!existsSync(file)) {
      filesMissing.push(file);
      continue;
    }

    dotenv.config({ path: file, override: false });
    filesLoaded.push(file);
  }

  return { filesLoaded, filesMissing };
}

export function present(value: string | undefined): 'YES' | 'NO' {
  return value && value.trim() !== '' ? 'YES' : 'NO';
}

export function safeUrlHost(value: string | undefined): string {
  if (!value || value.trim() === '') return 'NO';
  try {
    return new URL(value).host || 'INVALID';
  } catch {
    return 'INVALID';
  }
}
