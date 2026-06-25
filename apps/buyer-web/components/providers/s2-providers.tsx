'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/auth-provider';
import { makeQueryClient } from '@/lib/query-client';

/**
 * Sprint 2 providers — additive wrapper for auth + isolated query client.
 * ToastProvider lives in root QueryProvider (all routes including /search).
 */
export function Sprint2Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
