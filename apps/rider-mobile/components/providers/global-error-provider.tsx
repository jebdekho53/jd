import { useCallback, useState, type ReactNode } from 'react';
import { AppErrorBoundary } from '@/lib/error-boundary';
import { SyncPendingBanner } from '@/components/ui/sync-pending-banner';

export function GlobalErrorProvider({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);

  const handleRetry = useCallback(() => {
    setEpoch((e) => e + 1);
  }, []);

  return (
    <AppErrorBoundary key={epoch} onRetry={handleRetry}>
      <SyncPendingBanner />
      {children}
    </AppErrorBoundary>
  );
}
