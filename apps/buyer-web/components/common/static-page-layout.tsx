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
      <article className={cn('mx-auto max-w-3xl space-y-6 lg:max-w-4xl', className)}>
        <header className="rounded-2xl border border-border/60 bg-card px-5 py-6 shadow-card md:px-8 md:py-8">
          <h1 className="text-xl font-bold text-jd-text-primary md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-jd-text-muted md:text-base">{subtitle}</p>}
        </header>
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-6 shadow-card md:px-8 md:py-8">
          <div className="prose prose-sm max-w-none text-jd-text-secondary prose-headings:text-jd-text-primary prose-a:text-primary prose-li:marker:text-primary/60">
            {children}
          </div>
        </div>
        <footer className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-4 text-sm text-jd-text-muted">
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
