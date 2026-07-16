import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPasswordPageContent } from '@/features/auth/forgot-password-page-content';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
