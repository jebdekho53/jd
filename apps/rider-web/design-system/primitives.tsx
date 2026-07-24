import type { ReactNode } from 'react';

/** Shared dark-theme building blocks for every rider screen — replaces the
 *  Panel/Metric/EmptyState helpers that used to be copy-pasted separately
 *  into rider-home.tsx and captain-page-shell.tsx. */

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-rider-border bg-rider-surface p-4 shadow-card ${className}`}>
      {title && <h2 className="mb-3 text-sm font-bold text-rider-text">{title}</h2>}
      {children}
    </section>
  );
}

export function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'onDark' }) {
  return (
    <div className={`rounded-xl p-3 ${tone === 'onDark' ? 'bg-white/10' : 'border border-rider-border bg-rider-surface'}`}>
      <p className={`text-[11px] uppercase tracking-wide ${tone === 'onDark' ? 'text-white/60' : 'text-rider-muted'}`}>{label}</p>
      <p className="rider-num mt-1 truncate text-lg font-extrabold text-rider-text">{value}</p>
    </div>
  );
}

/** A big, sunlight-readable hero number — today's earnings, distance, etc. */
export function HeroStat({ label, value, unit, accent = false }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-rider-muted">{label}</p>
      <p className={`rider-num mt-1 text-4xl font-black leading-none ${accent ? 'text-rider-accent' : 'text-rider-text'}`}>
        {value}
        {unit && <span className="ml-1 text-base font-bold text-rider-muted">{unit}</span>}
      </p>
    </div>
  );
}

type StatusTone = 'awaiting' | 'toStore' | 'toCustomer' | 'delivered' | 'failed' | 'neutral';

const STATUS_TONE: Record<string, StatusTone> = {
  PENDING: 'awaiting',
  ASSIGNED: 'awaiting',
  OFFERED: 'awaiting',
  ACCEPTED: 'toStore',
  ARRIVED_AT_STORE: 'toStore',
  PICKED_UP: 'toCustomer',
  IN_TRANSIT: 'toCustomer',
  ARRIVED_AT_CUSTOMER: 'toCustomer',
  DELIVERED: 'delivered',
  COMPLETED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'failed',
  REJECTED: 'failed',
};

const TONE_CLASSES: Record<StatusTone, string> = {
  awaiting: 'bg-rider-accent/15 text-rider-accent',
  toStore: 'bg-rider-info/15 text-rider-info',
  toCustomer: 'bg-violet-400/15 text-violet-300',
  delivered: 'bg-rider-online/15 text-rider-online',
  failed: 'bg-rider-danger/15 text-rider-danger',
  neutral: 'bg-white/10 text-rider-muted',
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? 'neutral';
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-rider-border bg-rider-surface p-6 text-center">
      <p className="font-bold text-rider-text">{title}</p>
      <p className="mt-1 text-sm text-rider-muted">{body}</p>
    </div>
  );
}

/**
 * Renders a list-backed query's four states in one place.
 *
 * Written because pages were testing `data?.length === 0`, which is false when
 * `data` is undefined — so a failed request rendered a silently blank panel and
 * looked identical to "nothing here yet".
 */
export function QueryList<T>({
  query,
  empty,
  errorTitle = 'Could not load this',
  children,
}: {
  query: { data?: T[]; isLoading: boolean; isError: boolean };
  empty: string;
  errorTitle?: string;
  children: (items: T[]) => ReactNode;
}) {
  if (query.isLoading) return <p className="text-sm text-rider-muted">Loading…</p>;
  if (query.isError) {
    return (
      <p className="rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">
        {errorTitle}. Check your connection and try again.
      </p>
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) return <p className="text-sm text-rider-muted">{empty}</p>;
  return <>{children(items)}</>;
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-rider-border/60 py-2 last:border-0">
      <dt className="text-rider-muted">{label}</dt>
      <dd className="text-right font-semibold text-rider-text">{value}</dd>
    </div>
  );
}

export function Stop({ label, title, subtitle, tone = 'default' }: { label: string; title: string; subtitle?: string; tone?: 'default' | 'store' | 'customer' }) {
  const dot = tone === 'store' ? 'bg-rider-info' : tone === 'customer' ? 'bg-violet-400' : 'bg-rider-online';
  return (
    <div className="flex gap-3">
      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-rider-muted">{label}</p>
        <p className="font-semibold text-rider-text">{title}</p>
        {subtitle && <p className="text-sm text-rider-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'outline' | 'ghost';
  size?: 'lg' | 'md';
  className?: string;
  type?: 'button' | 'submit';
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-rider-accent text-rider-accent-foreground',
  danger: 'bg-rider-danger/15 text-rider-danger',
  outline: 'border border-rider-border bg-transparent text-rider-text',
  ghost: 'bg-white/5 text-rider-text',
};

export function Button({ children, onClick, disabled, variant = 'primary', size = 'md', className = '', type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl font-bold transition active:scale-[0.98] disabled:opacity-40 ${
        size === 'lg' ? 'h-14 text-base' : 'h-12 text-sm'
      } ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
