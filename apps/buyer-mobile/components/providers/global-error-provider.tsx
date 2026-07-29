import { useCallback, useState, type ReactNode } from 'react';
import { AppErrorBoundary } from '@/lib/error-boundary';

export function GlobalErrorProvider({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);

  const handleRetry = useCallback(() => {
    setEpoch((e) => e + 1);
  }, []);

  return (
    <AppErrorBoundary key={epoch} onRetry={handleRetry}>
      {children}
    </AppErrorBoundary>
  );
}
