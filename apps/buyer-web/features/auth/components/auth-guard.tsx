'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonLink, Container, Spinner, Text } from '@/design-system/primitives';
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

  if (requireAuth && !isAuthenticated) {
    return (
      <Container size="sm" className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Text variant="h3">Login required</Text>
        <Text variant="bodySm" className="text-muted-foreground">
          Sign in to continue to this page.
        </Text>
        <ButtonLink href={`${redirectTo}?returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}>
          Go to login
        </ButtonLink>
      </Container>
    );
  }

  return <>{children}</>;
}
