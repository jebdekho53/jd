import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Spinner } from '@/design-system';
import { ForgotPasswordContent } from '@/features/auth/forgot-password-content';

export const metadata: Metadata = { title: 'Forgot Password' };

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="text-admin-700" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
