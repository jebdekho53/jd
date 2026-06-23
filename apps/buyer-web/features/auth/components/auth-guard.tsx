'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Spinner, Text } from '@/design-system/primitives';
import { useAuthStore } from '@/store/auth-store';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  redirectTo = '/login',
  requireAuth = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      router.replace(`${redirectTo}?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [loading, isAuthenticated, requireAuth, redirectTo, router]);

  if (loading) {
    return (
      <Container size="sm" className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <Text variant="bodySm">Checking session…</Text>
      </Container>
    );
  }

  if (requireAuth && !isAuthenticated) return null;

  return <>{children}</>;
}
