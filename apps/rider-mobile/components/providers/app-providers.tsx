import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { GlobalErrorProvider } from '@/components/providers/global-error-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, gcTime: 10 * 60 * 1000 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <GlobalErrorProvider>{children}</GlobalErrorProvider>
    </QueryClientProvider>
  );
}
