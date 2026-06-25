'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ProfileErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ProfileErrorState({
  message = 'Something went wrong loading your profile.',
  onRetry,
}: ProfileErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center"
      role="alert"
    >
      <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
      <p className="mt-3 text-sm font-medium text-jd-text-primary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
