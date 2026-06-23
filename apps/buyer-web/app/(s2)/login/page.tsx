import { Suspense } from 'react';
import { Spinner } from '@/design-system/primitives';
import { LoginPageContent } from '@/features/auth/login-page-content';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
