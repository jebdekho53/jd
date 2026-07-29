import { useEffect } from 'react';
import { useMeQuery } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';

/**
 * Silently resolves whether the app is signed in, without blocking or
 * redirecting anything. Runs once at the app root so guest browsing (home,
 * search, product, store) never sits behind a loading screen waiting on
 * auth — AuthGuard (used only on screens that require login) reads the same
 * cached query result, so it resolves instantly once this has run.
 */
export function SessionSync() {
  const { data, status, error } = useMeQuery();
  const { setSession, clearSession } = useAuthStore();

  useEffect(() => {
    if (status === 'success' && data) {
      setSession(data);
    }
    if (status === 'error') {
      clearSession();
    }
  }, [status, data, error, setSession, clearSession]);

  return null;
}
