'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionQuery } from '@/hooks/use-auth';
import { isAdminUser } from '@/types/admin';
import { Spinner } from '@/design-system';

/**
 * Enforces ADMIN / SUPER_ADMIN access.
 * Role is verified from /auth/me (backend truth) — not client-side assumptions.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, data: user, isError, error } = useSessionQuery();

  useEffect(() => {
    if (status === 'pending') return;
    if (isError && error && 'status' in error && (error as { status: number }).status === 0) {
      return;
    }
    if (status === 'error' || (status === 'success' && !user)) {
      router.replace('/login');
      return;
    }
    if (status === 'success' && user && !isAdminUser(user)) {
      router.replace('/login?error=not_admin');
    }
  }, [status, user, isError, error, router]);

  if (status === 'pending') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Spinner className="text-admin-700" />
      </div>
    );
  }

  if (isError && error && 'status' in error && (error as { status: number }).status === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-surface text-sm text-slate-500">
        <p>Could not reach the server. Retrying…</p>
      </div>
    );
  }

  if (status === 'error' || (status === 'success' && !isAdminUser(user))) {
    return null;
  }

  return <>{children}</>;
}
