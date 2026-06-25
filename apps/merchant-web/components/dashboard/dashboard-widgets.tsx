import Link from 'next/link';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/design-system/primitives';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { SparkPoint } from '@/types/dashboard';

export function MiniSparkline({ data, color = '#0f766e' }: { data: SparkPoint[]; color?: string }) {
  if (!data.length) return null;
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  loading,
  sparkline,
  prefix = '',
  href,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  loading?: boolean;
  sparkline?: SparkPoint[];
  prefix?: string;
  href?: string;
}) {
  const positive = (change ?? 0) >= 0;
  const inner = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        {sparkline && <MiniSparkline data={sparkline} />}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-7 w-20" />
      ) : (
        <p className="mt-0.5 text-2xl font-bold text-slate-900">
          {prefix}
          {value}
        </p>
      )}
      {change !== undefined && !loading && (
        <p
          className={cn(
            'mt-1 flex items-center gap-0.5 text-xs font-medium',
            positive ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(change)}% vs yesterday
        </p>
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block no-underline text-inherit">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function DashboardSection({
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
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-2 underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
