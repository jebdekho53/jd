'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { ToastProvider } from '@/design-system/primitives';
import { GoogleMapsProvider } from '@jebdekho/google-maps';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <GoogleMapsProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </GoogleMapsProvider>
    </QueryProvider>
  );
}
