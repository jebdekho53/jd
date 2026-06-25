'use client';

import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';

interface RouteErrorProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
}

export function RouteError({
  error,
  reset,
  title = 'Something went wrong',
}: RouteErrorProps) {
  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-bold text-jd-text-primary">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-jd-text-muted">
          {error?.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {reset && (
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
