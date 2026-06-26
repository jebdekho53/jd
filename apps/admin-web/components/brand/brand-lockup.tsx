import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/cn';

interface BrandLockupProps {
  subtitle: string;
  href?: string;
  className?: string;
  inverted?: boolean;
}

export function BrandLockup({ subtitle, href, className, inverted = false }: BrandLockupProps) {
  const inner = (
    <>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-1',
          inverted ? 'bg-white' : 'bg-white shadow-sm ring-1 ring-slate-200/80',
        )}
      >
        <Logo size="xs" className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-semibold', inverted ? 'text-white' : 'text-slate-900')}>
          {BRAND_NAME}
        </p>
        <p
          className={cn(
            'truncate text-[10px] uppercase tracking-wider',
            inverted ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          {subtitle}
        </p>
      </div>
    </>
  );

  const wrapperClass = cn('flex items-center gap-2.5', className);

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {inner}
      </Link>
    );
  }

  return <div className={wrapperClass}>{inner}</div>;
}
