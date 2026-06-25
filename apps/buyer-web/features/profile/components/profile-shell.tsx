'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { cn } from '@/lib/utils';

interface ProfileShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
  hideNav?: boolean;
  className?: string;
}

export function ProfileShell({
  title,
  subtitle,
  backHref = '/profile',
  children,
  hideNav = false,
  className,
}: ProfileShellProps) {
  const router = useRouter();

  return (
    <PageShell>
      <div className={cn('mx-auto max-w-3xl space-y-4 md:max-w-none', className)}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-jd-text-secondary transition hover:bg-cream-3 md:hidden"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            {backHref && (
              <Link
                href={backHref}
                className="mb-1 hidden items-center gap-1 text-sm font-medium text-primary hover:underline md:inline-flex"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back
              </Link>
            )}
            <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-jd-text-muted">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </PageShell>
  );
}
