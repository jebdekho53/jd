'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdateAvailableToastProps {
  updateAvailable: boolean;
  onApply: () => Promise<void>;
  onDismiss: () => void;
}

export function UpdateAvailableToast({
  updateAvailable,
  onApply,
  onDismiss,
}: UpdateAvailableToastProps) {
  if (!updateAvailable) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[110] w-[min(100%,24rem)] -translate-x-1/2 rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-jd-text-primary">New JebDekho update available</p>
      <p className="mt-1 text-xs text-jd-text-muted">
        Update for the latest fixes, features, and performance improvements.
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" className="gap-1.5" onClick={() => void onApply()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Update now
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
          Later
        </Button>
      </div>
    </div>
  );
}
