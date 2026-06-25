import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

export function StatCard({ label, value, sublabel, icon, href, className }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-jd-text-muted">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-jd-text-primary">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-jd-text-muted">{sublabel}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </>
  );

  const base = cn(
    'rounded-2xl border border-border/50 bg-card p-4 shadow-card transition',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(base, 'card-hover block')}>
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
