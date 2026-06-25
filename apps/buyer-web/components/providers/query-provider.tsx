'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/design-system/primitives';
import { makeQueryClient } from '@/lib/query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
