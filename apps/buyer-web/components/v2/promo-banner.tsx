import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PromoBannerProps {
  title: string;
  description: string;
  cta: string;
  href: string;
  className?: string;
  variant?: 'accent' | 'neutral';
}

export function PromoBanner({
  title,
  description,
  cta,
  href,
  className,
  variant = 'accent',
}: PromoBannerProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-2xl border p-5 transition-shadow hover:shadow-md md:p-6',
        variant === 'accent'
          ? 'border-brand-500/20 bg-gradient-to-r from-brand-500/10 to-brand-500/5'
          : 'border-border bg-card',
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Limited offer</p>
      <h3 className="mt-1 text-lg font-bold text-foreground group-hover:text-primary">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-flex text-sm font-semibold text-primary">{cta} →</span>
    </Link>
  );
}
