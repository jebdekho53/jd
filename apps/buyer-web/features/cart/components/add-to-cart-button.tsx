'use client';

import { Plus, Minus } from 'lucide-react';
import { Button, Spinner } from '@/design-system/primitives';
import {
  useAddCartItemMutation,
  useCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/hooks/use-cart';
import { useCartStore } from '@/store/cart-store';
import { useGuestCartStore } from '@/store/guest-cart-store';
import { useAuthStore } from '@/store/auth-store';
import { SessionError } from '@/services/auth/auth-api';
import { addToServerWishlist } from '@/services/wishlist/wishlist-api';
import { useToast } from '@/design-system/primitives';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  storeName: string;
  storeId: string;
  availableQty: number;
  productName?: string;
  unitPrice?: number;
  imageUrl?: string;
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
  productName,
  unitPrice,
  imageUrl,
  compact = false,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart } = useCartQuery();
  const guestItems = useGuestCartStore((s) => s.items);
  const guestAddItem = useGuestCartStore((s) => s.addItem);
  const guestSetQty = useGuestCartStore((s) => s.setQuantity);
  const guestRemove = useGuestCartStore((s) => s.removeItem);
  const { toast } = useToast();
  const { setConflict } = useCartStore();
  const addItem = useAddCartItemMutation();
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();

  const guestLine = guestItems.find((i) => i.variantId === variantId);
  const cartItem = cart?.items.find((i) => i.variantId === variantId);
  const qty = isAuthenticated ? (cartItem?.quantity ?? 0) : (guestLine?.quantity ?? 0);
  const busy = addItem.isPending || updateItem.isPending || removeItem.isPending;

  // Out of stock: steer the user to the wishlist instead of a dead-end.
  const handleOutOfStock = async () => {
    if (isAuthenticated) {
      await addToServerWishlist(productId);
      toast("Out of stock — saved to your wishlist. We'll notify you when it's back.", 'success');
    } else {
      toast("Out of stock — sign in to save it and get notified when it's back.", 'error');
    }
  };

  const handleGuestAdd = () => {
    if (availableQty === 0) {
      void handleOutOfStock();
      return;
    }
    const guestStoreId = useGuestCartStore.getState().storeId;
    if (guestStoreId && guestStoreId !== storeId) {
      setConflict(
        { name: useGuestCartStore.getState().storeName ?? 'another store', storeId: guestStoreId },
        { productId, variantId, quantity: 1, newStoreName: storeName, newStoreId: storeId },
      );
      return;
    }
    try {
      guestAddItem({
        productId,
        variantId,
        storeId,
        storeName,
        productName,
        unitPrice,
        imageUrl,
        availableQty,
        quantity: 1,
      });
      toast('Added to cart', 'success');
    } catch {
      setConflict(
        { name: useGuestCartStore.getState().storeName ?? 'another store', storeId: guestStoreId! },
        { productId, variantId, quantity: 1, newStoreName: storeName, newStoreId: storeId },
      );
    }
  };

  const handleAdd = async () => {
    if (availableQty === 0) {
      await handleOutOfStock();
      return;
    }

    if (!isAuthenticated) {
      handleGuestAdd();
      return;
    }

    if (cart && cart.storeId !== storeId) {
      setConflict(
        { name: cart.store.name, storeId: cart.storeId },
        { productId, variantId, quantity: 1, newStoreName: storeName, newStoreId: storeId },
      );
      return;
    }

    try {
      await addItem.mutateAsync({ productId, variantId, quantity: 1 });
    } catch (err) {
      if (err instanceof SessionError && err.status === 409) {
        toast('Your cart has items from another store. Clear your cart to continue.', 'error');
      } else if (err instanceof SessionError && err.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast(err instanceof SessionError ? err.message : 'Failed to add to cart', 'error');
      }
    }
  };

  const handleDecrement = () => {
    if (!isAuthenticated) {
      if (!guestLine) return;
      if (qty <= 1) guestRemove(variantId);
      else guestSetQty(variantId, qty - 1);
      return;
    }
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
        loading={isAuthenticated && addItem.isPending}
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
        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary transition hover:bg-primary/10 disabled:opacity-40"
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
        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary transition hover:bg-primary/10 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
