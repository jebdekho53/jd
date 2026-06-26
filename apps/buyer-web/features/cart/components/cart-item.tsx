'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Spinner, Text } from '@/design-system/primitives';
import { cn } from '@/lib/cn';
import { useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/hooks/use-cart';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const update = useUpdateCartItemMutation();
  const remove = useRemoveCartItemMutation();
  const busy = update.isPending || remove.isPending;

  const decrement = () => {
    if (item.quantity <= 1) {
      remove.mutate(item.id);
    } else {
      update.mutate({ itemId: item.id, quantity: item.quantity - 1 });
    }
  };

  const increment = () => {
    if (item.quantity >= item.availableQty) return;
    update.mutate({ itemId: item.id, quantity: item.quantity + 1 });
  };

  const img = item.product.imageUrls[0];
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex gap-3 py-4">
      {/* Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-3">
        {img ? (
          <Image src={img} alt={item.product.name} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xl">🛒</div>
        )}
        {item.product.isVeg !== null && (
          <span
            className={cn(
              'absolute right-1 top-1 h-3 w-3 rounded-full border border-white',
              item.product.isVeg ? 'bg-green-500' : 'bg-red-500',
            )}
          />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1">
        <Text variant="label" className="line-clamp-2 leading-snug">
          {item.product.name}
        </Text>
        <Text variant="caption">{item.variant.name}</Text>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-jd-text-primary tabular-nums">
              ₹{lineTotal.toFixed(2)}
            </span>
            <span className="text-[11px] text-jd-text-muted">
              ₹{item.unitPrice.toFixed(2)} each
              {item.mrp && item.mrp > item.unitPrice && (
                <span className="ml-1 line-through">₹{item.mrp.toFixed(2)}</span>
              )}
            </span>
          </div>

          {/* Qty controls */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-0.5">
            <button
              type="button"
              aria-label={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
              disabled={busy}
              onClick={decrement}
              className="flex h-9 w-9 items-center justify-center rounded-full text-jd-text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              {item.quantity === 1 ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
            </button>

            <span className="w-7 text-center text-sm font-bold tabular-nums">
              {busy ? <Spinner size="sm" /> : item.quantity}
            </span>

            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || item.quantity >= item.availableQty}
              onClick={increment}
              className="flex h-9 w-9 items-center justify-center rounded-full text-jd-text-secondary transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
