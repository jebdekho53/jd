'use client';

import { CreditCard, Banknote } from 'lucide-react';
import { Text } from '@/design-system/primitives';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types/checkout';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** Self-delivery stores have no rider to collect cash on the platform's behalf. */
  codDisabled?: boolean;
}

const METHODS: { id: PaymentMethod; label: string; sub: string; Icon: typeof Banknote }[] = [
  {
    id: 'COD',
    label: 'Cash on delivery',
    sub: 'Pay when your order arrives',
    Icon: Banknote,
  },
  {
    id: 'RAZORPAY',
    label: 'Pay online',
    sub: 'Cards, UPI, net banking via Razorpay',
    Icon: CreditCard,
  },
];

export function PaymentMethodSelector({ value, onChange, codDisabled }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Text variant="label" className="block">
        Select payment method
      </Text>
      {METHODS.map(({ id, label, sub, Icon }) => {
        const disabled = id === 'COD' && codDisabled;
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(id)}
            className={cn(
              'flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors',
              disabled
                ? 'cursor-not-allowed border-border bg-neutral-50 opacity-50'
                : value === id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-neutral-300',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                !disabled && value === id ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <Text variant="label">{label}</Text>
              <Text variant="caption">{disabled ? 'Not available for this store — pay online instead' : sub}</Text>
            </div>
            {!disabled && (
              <div
                className={cn(
                  'ml-auto h-4 w-4 rounded-full border-2',
                  value === id ? 'border-primary bg-primary' : 'border-neutral-300',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
