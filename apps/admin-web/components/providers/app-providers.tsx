'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ToastProvider } from '@/design-system';
import { GoogleMapsProvider } from '@jebdekho/google-maps';
import { StepUpModal } from '@/components/auth/step-up-modal';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <GoogleMapsProvider>
        <ToastProvider>
          {children}
          <StepUpModal />
        </ToastProvider>
      </GoogleMapsProvider>
    </QueryProvider>
  );
}
