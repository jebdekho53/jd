'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '@/design-system/primitives';
import { AuthProvider } from '@/features/auth/auth-provider';
import { makeQueryClient } from '@/lib/query-client';

/**
 * Sprint 2 providers — additive wrapper.
 * Mount in route group layout without replacing Sprint 1 QueryProvider in root.
 */
export function Sprint2Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
