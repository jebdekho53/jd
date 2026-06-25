import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Spinner } from '@/design-system';
import { ResetPasswordContent } from '@/features/auth/reset-password-content';

export const metadata: Metadata = { title: 'Reset Password' };

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="text-admin-700" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
