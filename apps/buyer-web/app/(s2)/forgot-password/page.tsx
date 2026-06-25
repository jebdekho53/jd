import { Suspense } from 'react';
import { Spinner } from '@/design-system/primitives';
import { ForgotPasswordPageContent } from '@/features/auth/forgot-password-page-content';

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
