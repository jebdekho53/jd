'use client';

import { Clock, Info, Minus, Plus, ShoppingBag, Tag } from 'lucide-react';
import { Text } from '@/design-system/primitives';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { useUpdateCartItemMutation, useRemoveCartItemMutation } from '@/hooks/use-cart';
import { useDeliveryEta } from '@/hooks/use-buyer-queries';
import type { Cart, CartItem } from '@/types/cart';
import type { DeliveryAddress } from '@/types/checkout';

interface CheckoutSummaryProps {
  cart: Cart;
  address: DeliveryAddress;
}

function formatPackSize(grams: number | null): string | null {
  if (!grams || grams <= 0) return null;
  return grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg` : `${grams} g`;
}

export function CheckoutSummary({ cart, address }: CheckoutSummaryProps) {
  const eta = useDeliveryEta(cart.storeId, address.lat, address.lng);
  const etaMinutes = eta.data?.etaMinutes ?? null;
  const totalSavings = cart.totals.totalSavings ?? cart.totals.discount ?? 0;

  return (
    <div className="space-y-3">
      {/* Delivery ETA hero */}
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {eta.isLoading ? (
            <Text variant="label">Checking delivery time…</Text>
          ) : etaMinutes ? (
            <>
              <Text variant="label" className="text-primary">
                Arriving in ~{etaMinutes} min
              </Text>
              <Text variant="caption">
                {cart.store.name}
                {eta.data?.distanceKm ? ` · ${eta.data.distanceKm} km away` : ''}
              </Text>
            </>
          ) : (
            <>
              <Text variant="label">Delivery from {cart.store.name}</Text>
              <Text variant="caption">We&apos;ll confirm your delivery time shortly</Text>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
        {/* Address */}
        <div className="flex items-start gap-3">
          <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
          <div className="min-w-0">
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
        <div className="space-y-3 border-t border-neutral-100 pt-3">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Savings banner */}
        {totalSavings > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <Tag className="h-4 w-4 text-emerald-600" />
            <Text variant="bodySm" className="font-semibold text-emerald-700">
              You saved ₹{totalSavings.toFixed(2)} on this order
            </Text>
          </div>
        )}

        {/* Bill details */}
        <div className="space-y-1.5 border-t border-neutral-100 pt-3">
          <Text variant="caption" className="mb-1 block uppercase tracking-wide text-neutral-400">
            Bill details
          </Text>

          <BillRow label="Items total" value={`₹${cart.totals.subtotal.toFixed(2)}`} />

          {cart.totals.discount > 0 && (
            <BillRow
              label="Discount"
              value={`-₹${cart.totals.discount.toFixed(2)}`}
              valueClass="text-emerald-700"
            />
          )}

          {cart.totals.tax > 0 && (
            <BillRow
              label="GST & taxes"
              value={`₹${cart.totals.tax.toFixed(2)}`}
              info="Government taxes applicable on this order"
            />
          )}

          <BillRow
            label="Delivery fee"
            value={cart.totals.deliveryFee === 0 ? 'Free' : `₹${cart.totals.deliveryFee.toFixed(2)}`}
            valueClass={cart.totals.deliveryFee === 0 ? 'font-semibold text-emerald-700' : undefined}
            info="Charged by the store / delivery partner based on distance"
          />

          <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2">
            <Text variant="label">To pay</Text>
            <Text variant="label">₹{cart.totals.grandTotal.toFixed(2)}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateQty = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();
  const pending = updateQty.isPending || removeItem.isPending;
  const packSize = formatPackSize(item.variant.weightGrams);
  const hasMrp = item.mrp != null && item.mrp > item.unitPrice;

  const setQty = (next: number) => {
    if (pending) return;
    if (next <= 0) removeItem.mutate(item.id);
    else updateQty.mutate({ itemId: item.id, quantity: next });
  };

  return (
    <div className="flex gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-cream-3">
        <ImageWithFallback
          src={item.product.imageUrls?.[0]}
          alt={item.product.name}
          fill
          sizes="56px"
          className="object-contain p-1"
          fallback={
            <div className="grid h-full w-full place-items-center text-neutral-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
          }
        />
      </div>

      <div className="min-w-0 flex-1">
        <Text variant="bodySm" className="line-clamp-2 font-medium">
          {item.product.name}
        </Text>
        {packSize && <Text variant="caption">{packSize}</Text>}

        <div className="mt-1.5 flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-primary/30">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty(item.quantity - 1)}
              disabled={pending}
              className="grid h-7 w-7 place-items-center text-primary disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty(item.quantity + 1)}
              disabled={pending || item.quantity >= item.availableQty}
              className="grid h-7 w-7 place-items-center text-primary disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-right">
        <Text variant="bodySm" className="font-semibold">
          ₹{item.lineTotal.toFixed(2)}
        </Text>
        {hasMrp && (
          <Text variant="caption" className="text-neutral-400 line-through">
            ₹{(item.mrp! * item.quantity).toFixed(2)}
          </Text>
        )}
      </div>
    </div>
  );
}

function BillRow({
  label,
  value,
  valueClass,
  info,
}: {
  label: string;
  value: string;
  valueClass?: string;
  info?: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="inline-flex items-center gap-1">
        <Text variant="bodySm">{label}</Text>
        {info && (
          <span title={info} className="cursor-help text-neutral-400">
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <Text variant="bodySm" className={valueClass}>
        {value}
      </Text>
    </div>
  );
}
