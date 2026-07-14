'use client';

import Link from 'next/link';
import { Clock, Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { CartItem } from '@/features/cart/components/cart-item';
import { CartSummary } from '@/features/cart/components/cart-summary';
import { CartEmpty } from '@/features/cart/components/cart-empty';
import { CartSkeleton } from '@/features/cart/components/cart-skeleton';
import { CartStoreConflictModal } from '@/features/cart/components/cart-store-conflict-modal';
import { ActionBar, ButtonLink } from '@/design-system/primitives';
import { useCartQuery, useClearCartMutation } from '@/hooks/use-cart';
import { useToast } from '@/design-system/primitives';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useGuestCartStore } from '@/store/guest-cart-store';

export function CartPageContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const { data: cart, isLoading, isFetching } = useCartQuery();
  const guestItems = useGuestCartStore((s) => s.items);
  const guestStoreName = useGuestCartStore((s) => s.storeName);
  const guestSetQty = useGuestCartStore((s) => s.setQuantity);
  const guestRemove = useGuestCartStore((s) => s.removeItem);
  const guestClear = useGuestCartStore((s) => s.clear);
  const clearCart = useClearCartMutation();
  const { toast } = useToast();

  const isGuestCart = !isAuthenticated && guestItems.length > 0;
  const guestSubtotal = guestItems.reduce(
    (sum, i) => sum + (i.unitPrice ?? 0) * i.quantity,
    0,
  );
  const guestCount = guestItems.reduce((sum, i) => sum + i.quantity, 0);

  const meetsMin = cart
    ? cart.totals.subtotal >= cart.store.minOrderAmount
    : false;

  const handleClear = async () => {
    if (!confirm('Clear your entire cart?')) return;
    try {
      if (isAuthenticated) {
        await clearCart.mutateAsync();
      } else {
        guestClear();
      }
      toast('Cart cleared', 'info');
    } catch {
      toast('Failed to clear cart', 'error');
    }
  };

  const hasServerItems = Boolean(cart && cart.items.length > 0);
  const hasItems = hasServerItems || isGuestCart;
  const cartBootstrapping =
    authLoading || (isAuthenticated && (isLoading || isFetching) && !cart);

  return (
    <PageShell hideMobileNav={hasItems}>
      <div className="space-y-5 pb-24 lg:pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Your cart</h1>
            {hasServerItems && cart && (
              <p className="mt-1 text-sm text-muted-foreground">
                {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} from {cart.store.name}
              </p>
            )}
            {isGuestCart && (
              <p className="mt-1 text-sm text-muted-foreground">
                {guestCount} item{guestCount !== 1 ? 's' : ''} from {guestStoreName}
              </p>
            )}
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={handleClear}
              disabled={clearCart.isPending}
              className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
            >
              Clear all
            </button>
          )}
        </div>

        {cartBootstrapping ? (
          <CartSkeleton />
        ) : isGuestCart ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-jd-text-secondary">
              <Link href="/login?returnUrl=/cart" className="font-semibold text-primary hover:underline">
                Log in
              </Link>{' '}
              to checkout — your items are saved on this device.
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border bg-cream-3 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
                  {guestStoreName}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {guestItems.map((item) => (
                  <li key={item.variantId} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.productName ?? 'Product'}</p>
                      {item.unitPrice != null && (
                        <p className="text-xs text-jd-text-muted">{formatCurrency(item.unitPrice)} each</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          item.quantity <= 1
                            ? guestRemove(item.variantId)
                            : guestSetQty(item.variantId, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => guestSetQty(item.variantId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <ActionBar position="flush" mobileOnly={false}>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-jd-text-muted">Estimated ({guestCount} items)</p>
                <p className="text-lg font-bold">{formatCurrency(guestSubtotal)}</p>
              </div>
              <div className="w-[170px] shrink-0">
                <ButtonLink href="/login?returnUrl=/cart" fullWidth>
                  Login to checkout
                </ButtonLink>
              </div>
            </ActionBar>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <CartEmpty />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
            {cart.totals.discount > 0 && (
              <div className="col-span-full flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success lg:col-span-2">
                🎉 You&apos;re saving {formatCurrency(cart.totals.discount)} on this order
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border bg-cream-3 px-4 py-3">
                <Link href={`/store/${cart.store.slug}`} className="group flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-semibold group-hover:text-primary">{cart.store.name}</span>
                  </span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    COD available
                  </span>
                </Link>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-jd-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3 w-3" aria-hidden />
                    {cart.totals.deliveryFee === 0 ? 'Free delivery' : `Delivery ${formatCurrency(cart.totals.deliveryFee)}`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden />
                    Fast local delivery
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border px-4">
                {cart.items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold">Order summary</h2>
                <CartSummary cart={cart} />
              </div>

              <div className="hidden lg:block">
                <ButtonLink href="/checkout" fullWidth disabled={!meetsMin} className="text-base">
                  Proceed to checkout
                </ButtonLink>
                {!meetsMin && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Min order ₹{cart.store.minOrderAmount}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {hasServerItems && cart && (
          <ActionBar position="flush" mobileOnly={false} className="lg:hidden">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-jd-text-muted">Total ({cart.itemCount} items)</p>
              <p className="text-lg font-bold text-jd-text-primary">
                {formatCurrency(cart.totals.grandTotal)}
              </p>
            </div>
            <div className="w-[170px] shrink-0">
              <ButtonLink href="/checkout" fullWidth disabled={!meetsMin}>
                {meetsMin ? 'Checkout' : `Min ₹${cart.store.minOrderAmount}`}
              </ButtonLink>
            </div>
          </ActionBar>
        )}

        <CartStoreConflictModal />
      </div>
    </PageShell>
  );
}
