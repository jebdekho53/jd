import { SessionError } from '@/services/auth/auth-api';

/** Network/offline failures should preserve cookies and cached session state. */
export function isOfflineSessionError(err: unknown): boolean {
  return err instanceof SessionError && err.status === 0;
}

/** Only explicit 401 from /me means the session is invalid. */
export function isAuthExpiredError(err: unknown): boolean {
  return err instanceof SessionError && err.status === 401;
}
