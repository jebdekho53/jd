/**
 * Authenticated client for BFF buyer routes.
 * Mirrors Sprint 2 sessionFetch but targets /api/buyer/* paths.
 */

import { SessionError } from '@/services/auth/auth-api';
import { useAuthStore } from '@/store/auth-store';

export async function buyerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new SessionError(
      'No internet connection. Check your network and try again.',
      0,
      'OFFLINE',
    );
  }

  if (res.status === 401) {
    useAuthStore.getState().clearSession();
    throw new SessionError('Session expired. Please log in again.', 401, 'UNAUTHENTICATED');
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Something went wrong';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    throw new SessionError(message, res.status);
  }

  return body as T;
}
