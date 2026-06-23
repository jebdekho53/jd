'use client';

import { Text } from '@/design-system/primitives';
import type { Cart } from '@/types/cart';

interface CartSummaryProps {
  cart: Cart;
  className?: string;
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Text variant="bodySm" className={accent ? 'font-medium' : ''}>
        {label}
      </Text>
      <Text variant="bodySm" className={accent ? 'font-semibold text-emerald-700' : ''}>
        {value}
      </Text>
    </div>
  );
}

export function CartSummary({ cart, className }: CartSummaryProps) {
  const { totals } = cart;
  const meetsMin = totals.subtotal >= cart.store.minOrderAmount;

  return (
    <div className={className}>
      <div className="divide-y divide-neutral-100">
        <Row label="Subtotal" value={`₹${totals.subtotal.toFixed(2)}`} />
        {totals.discount > 0 && (
          <Row label="Savings" value={`-₹${totals.discount.toFixed(2)}`} accent />
        )}
        <Row label="Delivery fee" value={totals.deliveryFee === 0 ? 'Free' : `₹${totals.deliveryFee.toFixed(2)}`} />
        {totals.tax > 0 && <Row label="Tax" value={`₹${totals.tax.toFixed(2)}`} />}
      </div>

      <div className="mt-2 border-t border-neutral-200 pt-3">
        <div className="flex items-center justify-between">
          <Text variant="label" className="text-base">
            Total
          </Text>
          <Text variant="label" className="text-base">
            ₹{totals.grandTotal.toFixed(2)}
          </Text>
        </div>
      </div>

      {!meetsMin && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Add ₹{(cart.store.minOrderAmount - totals.subtotal).toFixed(2)} more to meet the minimum
          order of ₹{cart.store.minOrderAmount}
        </div>
      )}
    </div>
  );
}
