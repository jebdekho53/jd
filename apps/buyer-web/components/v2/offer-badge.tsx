import { cn } from '@/lib/utils';

interface OfferBadgeProps {
  label: string;
  className?: string;
  variant?: 'discount' | 'offer' | 'new';
}

export function OfferBadge({ label, className, variant = 'discount' }: OfferBadgeProps) {
  const styles = {
    discount: 'bg-primary text-primary-foreground',
    offer: 'bg-brand-500/15 text-brand-700',
    new: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
