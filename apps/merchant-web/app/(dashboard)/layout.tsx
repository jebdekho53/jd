import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';
import { AuthGuard } from '@/features/auth/components/auth-guard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <AuthGuard>{children}</AuthGuard>
    </AppProviders>
  );
}
