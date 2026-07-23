'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { PwaProvider } from '@/features/pwa/pwa-provider';
import { StepUpModal } from '@/components/auth/step-up-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <PwaProvider>{children}</PwaProvider>
      <StepUpModal />
    </QueryClientProvider>
  );
}
