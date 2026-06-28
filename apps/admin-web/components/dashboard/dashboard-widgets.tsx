'use client';

import Link from 'next/link';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';

export function AdminMetricCard({
  label,
  value,
  sub,
  loading,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      )}
      {sub && !loading && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </>
  );

  const className = cn(
    'rounded-lg border bg-card p-4 shadow-sm',
    href &&
      'block cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${label}: ${loading ? 'loading' : value}`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function AdminSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function HealthPill({
  label,
  status,
  href,
}: {
  label: string;
  status: string;
  href?: string;
}) {
  const up =
    status === 'up' ||
    status === 'healthy' ||
    status === 'configured' ||
    status === 'running' ||
    status === 'active';
  const muted =
    status === 'disabled' ||
    status === 'coming_soon' ||
    status === 'console' ||
    status === 'not_configured' ||
    status === 'unavailable';
  const pill = (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm',
        href && 'cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-semibold',
          up
            ? 'bg-emerald-100 text-emerald-800'
            : muted
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800',
        )}
      >
        {status === 'coming_soon' ? 'Coming Soon' : status}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {pill}
      </Link>
    );
  }

  return pill;
}

export function MiniTrend({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
