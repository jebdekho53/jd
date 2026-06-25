import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuRowProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  danger?: boolean;
  className?: string;
}

export function MenuRow({
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
  badge,
  danger,
  className,
}: MenuRowProps) {
  const inner = (
    <>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-semibold', danger ? 'text-destructive' : 'text-jd-text-primary')}>
            {title}
          </p>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-jd-text-muted">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-jd-text-muted" aria-hidden />
    </>
  );

  const base = cn(
    'flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3 text-left shadow-card transition card-hover',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base}>
      {inner}
    </button>
  );
}
