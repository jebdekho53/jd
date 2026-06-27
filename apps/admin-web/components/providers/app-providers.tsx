'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ToastProvider } from '@/design-system';
import { GoogleMapsProvider } from '@jebdekho/google-maps';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <GoogleMapsProvider>
        <ToastProvider>{children}</ToastProvider>
      </GoogleMapsProvider>
    </QueryProvider>
  );
}
