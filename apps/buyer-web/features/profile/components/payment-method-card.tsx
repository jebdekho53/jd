'use client';

import { CreditCard, Landmark, Smartphone } from 'lucide-react';
import type { PaymentMethod } from '@/features/profile/types';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
} as const;

interface PaymentMethodCardProps {
  method: PaymentMethod;
  className?: string;
}

export function PaymentMethodCard({ method, className }: PaymentMethodCardProps) {
  const Icon = TYPE_ICONS[method.type];

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-card/50 p-4',
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-3 text-jd-text-secondary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-jd-text-primary">{method.label}</p>
        <p className="text-xs text-jd-text-muted">{method.detail}</p>
      </div>
      <span className="rounded-full bg-cream-3 px-2 py-0.5 text-[10px] font-semibold uppercase text-jd-text-muted">
        Coming soon
      </span>
    </div>
  );
}
