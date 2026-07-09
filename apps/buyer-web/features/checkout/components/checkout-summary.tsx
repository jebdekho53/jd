'use client';

import { MapPin, ShoppingBag } from 'lucide-react';
import { Text } from '@/design-system/primitives';
import type { Cart } from '@/types/cart';
import type { DeliveryAddress } from '@/types/checkout';

interface CheckoutSummaryProps {
  cart: Cart;
  address: DeliveryAddress;
}

export function CheckoutSummary({ cart, address }: CheckoutSummaryProps) {
  return (
    <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
      {/* Store */}
      <div className="flex items-start gap-3">
        <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
        <div>
          <Text variant="caption">Ordering from</Text>
          <Text variant="label">{cart.store.name}</Text>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
        <div>
          <Text variant="caption">Delivering to</Text>
          <Text variant="label">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
          </Text>
          <Text variant="bodySm">
            {address.city}, {address.pincode}
          </Text>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-neutral-100 pt-3">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-1.5">
            <Text variant="bodySm">
              {item.product.name}{' '}
              <span className="text-neutral-500">× {item.quantity}</span>
            </Text>
            <Text variant="bodySm">₹{item.lineTotal.toFixed(2)}</Text>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-neutral-100 pt-3">
        {(cart.totals.offerDiscount ?? 0) > 0 && (
          <div className="flex items-center justify-between py-1">
            <Text variant="bodySm">Offer discount</Text>
            <Text variant="bodySm" className="text-emerald-700">
              -₹{(cart.totals.offerDiscount ?? 0).toFixed(2)}
            </Text>
          </div>
        )}
        {(cart.totals.couponDiscount ?? 0) > 0 && (
          <div className="flex items-center justify-between py-1">
            <Text variant="bodySm">Coupon discount</Text>
            <Text variant="bodySm" className="text-emerald-700">
              -₹{(cart.totals.couponDiscount ?? 0).toFixed(2)}
            </Text>
          </div>
        )}
        {cart.totals.discount > 0 && (
          <div className="flex items-center justify-between py-1">
            <Text variant="bodySm">Savings</Text>
            <Text variant="bodySm" className="text-emerald-700">
              -₹{cart.totals.discount.toFixed(2)}
            </Text>
          </div>
        )}
        <div className="flex items-center justify-between py-1">
          <Text variant="bodySm">
            Delivery
            {cart.delivery?.mode === 'SELF' && (
              <span className="ml-1 text-emerald-600">· by store</span>
            )}
          </Text>
          <Text variant="bodySm" className={cart.totals.deliveryFee === 0 ? 'font-semibold text-emerald-700' : ''}>
            {cart.totals.deliveryFee === 0 ? 'Free' : `₹${cart.totals.deliveryFee.toFixed(2)}`}
          </Text>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2">
          <Text variant="label">Total to pay</Text>
          <Text variant="label">₹{cart.totals.grandTotal.toFixed(2)}</Text>
        </div>
      </div>
    </div>
  );
}
