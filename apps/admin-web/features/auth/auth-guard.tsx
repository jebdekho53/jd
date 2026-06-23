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
  const { status, data: user } = useSessionQuery();

  useEffect(() => {
    if (status === 'error') {
      router.replace('/login');
      return;
    }
    if (status === 'success' && user && !isAdminUser(user)) {
      router.replace('/login?error=not_admin');
    }
  }, [status, user, router]);

  if (status === 'pending') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Spinner className="text-admin-700" />
      </div>
    );
  }

  if (status === 'error' || (status === 'success' && !isAdminUser(user))) {
    return null;
  }

  return <>{children}</>;
}
