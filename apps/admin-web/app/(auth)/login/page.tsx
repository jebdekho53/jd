import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Spinner } from '@/design-system';
import { LoginPageContent } from '@/features/auth/login-page-content';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="text-admin-700" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
