'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button, Spinner } from '@/design-system/primitives';
import { useAddCartItemMutation, useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/hooks/use-cart';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { SessionError } from '@/services/auth/auth-api';
import { useToast } from '@/design-system/primitives';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  storeName: string;
  storeId: string;
  availableQty: number;
  /** compact = only + button, no quantity control */
  compact?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  variantId,
  storeName,
  storeId,
  availableQty,
  compact = false,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart } = useCartQuery();
  const { toast } = useToast();
  const { setConflict } = useCartStore();
  const addItem = useAddCartItemMutation();
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();

  // Find current quantity in cart
  const cartItem = cart?.items.find((i) => i.variantId === variantId);
  const qty = cartItem?.quantity ?? 0;
  const busy = addItem.isPending || updateItem.isPending || removeItem.isPending;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      router.push('/login?returnUrl=/stores');
      return;
    }
    if (availableQty === 0) return;

    // Check cross-store conflict
    if (cart && cart.storeId !== storeId) {
      setConflict(
        { name: cart.store.name, storeId: cart.storeId },
        { productId, variantId, quantity: 1, newStoreName: storeName },
      );
      return;
    }

    try {
      await addItem.mutateAsync({ productId, variantId, quantity: 1 });
    } catch (err) {
      if (err instanceof SessionError && err.status === 409) {
        // Cross-store conflict from server (race condition)
        toast('Your cart has items from another store. Clear your cart to continue.', 'error');
      } else {
        toast(err instanceof SessionError ? err.message : 'Failed to add to cart', 'error');
      }
    }
  };

  const handleDecrement = () => {
    if (!cartItem) return;
    if (qty <= 1) {
      removeItem.mutate(cartItem.id);
    } else {
      updateItem.mutate({ itemId: cartItem.id, quantity: qty - 1 });
    }
  };

  if (availableQty === 0) {
    return (
      <Button variant="outline" disabled className={cn('text-xs', className)}>
        Out of stock
      </Button>
    );
  }

  if (qty === 0 || compact) {
    return (
      <Button
        size="sm"
        onClick={handleAdd}
        loading={addItem.isPending}
        className={className}
        disabled={availableQty === 0}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={busy}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">
        {busy ? <Spinner size="sm" /> : qty}
      </span>
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy || qty >= availableQty}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
