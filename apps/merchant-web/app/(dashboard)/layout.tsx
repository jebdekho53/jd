import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { LegalReacceptGate } from '@/features/legal/legal-reaccept-gate';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <AuthGuard>
        <LegalReacceptGate portal="merchant" agreementHref="/agreement">
          {children}
        </LegalReacceptGate>
      </AuthGuard>
    </AppProviders>
  );
}
