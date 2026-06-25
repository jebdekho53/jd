'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
