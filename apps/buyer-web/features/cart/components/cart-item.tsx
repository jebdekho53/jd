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

  return (
    <div className="flex gap-3 py-4">
      {/* Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {img ? (
          <Image src={img} alt={item.product.name} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xl">🛒</div>
        )}
        {item.product.isVeg !== null && (
          <span
            className={cn(
              'absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-white',
              item.product.isVeg ? 'bg-green-500' : 'bg-red-500',
            )}
          />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1">
        <Text variant="label" className="line-clamp-1">
          {item.product.name}
        </Text>
        <Text variant="caption">{item.variant.name}</Text>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <Text variant="label">₹{item.unitPrice.toFixed(2)}</Text>
            {item.mrp && item.mrp > item.unitPrice && (
              <Text variant="caption" className="line-through">
                ₹{item.mrp.toFixed(2)}
              </Text>
            )}
          </div>

          {/* Qty controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={busy}
              onClick={decrement}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-40"
            >
              {item.quantity === 1 ? (
                <Trash2 className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </button>

            <span className="w-6 text-center text-sm font-semibold tabular-nums">
              {busy ? <Spinner size="sm" /> : item.quantity}
            </span>

            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || item.quantity >= item.availableQty}
              onClick={increment}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
