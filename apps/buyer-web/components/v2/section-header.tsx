import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'See all',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
