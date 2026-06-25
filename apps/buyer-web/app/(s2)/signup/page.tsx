import { Suspense } from 'react';
import { Spinner } from '@/design-system/primitives';
import { SignupPageContent } from '@/features/auth/signup-page-content';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
