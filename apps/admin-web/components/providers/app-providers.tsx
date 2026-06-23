'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ToastProvider } from '@/design-system';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </QueryProvider>
  );
}
