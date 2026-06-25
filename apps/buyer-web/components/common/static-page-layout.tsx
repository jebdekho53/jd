'use client';

import Link from 'next/link';
import { PageShell } from '@/components/layout/site-shell';
import { cn } from '@/lib/utils';

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function StaticPageLayout({ title, subtitle, children, className }: StaticPageLayoutProps) {
  return (
    <PageShell>
      <article className={cn('mx-auto max-w-3xl space-y-8', className)}>
        <header>
          <h1 className="text-2xl font-bold text-jd-text-primary md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-jd-text-muted">{subtitle}</p>}
        </header>
        <div className="prose prose-sm max-w-none text-jd-text-secondary prose-headings:text-jd-text-primary prose-a:text-primary">
          {children}
        </div>
        <footer className="border-t border-border/50 pt-6 text-sm text-jd-text-muted">
          <p>
            Need help?{' '}
            <Link href="/help" className="font-medium text-primary hover:underline">
              Visit our help center
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              contact support
            </Link>
            .
          </p>
        </footer>
      </article>
    </PageShell>
  );
}
