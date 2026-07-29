import { getAccessToken, getBffBaseUrl } from '@/lib/auth/session';
import type { NormalizedError } from '@/types/errors';
import type { LogEntry } from '@/services/logger';
async function logFetch(path: string, body: unknown) {
  const base = getBffBaseUrl();
  const token = await getAccessToken();
  await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Client': 'rider-mobile',
    },
    body: JSON.stringify(body),
  });
}

export async function postClientError(payload: NormalizedError & Record<string, unknown>) {
  try {
    await logFetch('/api/rider/logs/error', payload);
  } catch {
    /* best effort */
  }
}

export async function postLogBatch(entries: LogEntry[]) {
  await logFetch('/api/rider/logs/batch', { entries });
}
