'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { CartItem } from '@/features/cart/components/cart-item';
import { CartSummary } from '@/features/cart/components/cart-summary';
import { CartEmpty } from '@/features/cart/components/cart-empty';
import { CartSkeleton } from '@/features/cart/components/cart-skeleton';
import { CartStoreConflictModal } from '@/features/cart/components/cart-store-conflict-modal';
import { ButtonLink } from '@/design-system/primitives';
import { useCartQuery, useClearCartMutation } from '@/hooks/use-cart';
import { useToast } from '@/design-system/primitives';
import { formatCurrency } from '@/lib/utils';

export function CartPageContent() {
  const { data: cart, isLoading } = useCartQuery();
  const clearCart = useClearCartMutation();
  const { toast } = useToast();

  const meetsMin = cart
    ? cart.totals.subtotal >= cart.store.minOrderAmount
    : false;

  const handleClear = async () => {
    if (!confirm('Clear your entire cart?')) return;
    try {
      await clearCart.mutateAsync();
      toast('Cart cleared', 'info');
    } catch {
      toast('Failed to clear cart', 'error');
    }
  };

  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Your cart</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review items before checkout
              </p>
            </div>
            {cart && cart.items.length > 0 && (
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

          {isLoading ? (
            <CartSkeleton />
          ) : !cart || cart.items.length === 0 ? (
            <CartEmpty />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              {cart.totals.discount > 0 && (
                <div className="col-span-full rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success lg:col-span-2">
                  You&apos;re saving {formatCurrency(cart.totals.discount)} on this order
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
                <div className="border-b border-border/60 bg-cream-3 px-4 py-3">
                  <Link href={`/stores/${cart.store.slug}`} className="group flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
                      <span className="text-sm font-semibold group-hover:text-primary">{cart.store.name}</span>
                    </span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      COD available
                    </span>
                  </Link>
                  <p className="mt-1 text-xs text-jd-text-muted">Fast local delivery available</p>
                </div>
                <div className="divide-y divide-border/60 px-4">
                  {cart.items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold">Order summary</h2>
                  <CartSummary cart={cart} />
                </div>

                <ButtonLink
                  href="/checkout"
                  fullWidth
                  disabled={!meetsMin}
                  className="text-base"
                >
                  Proceed to checkout
                </ButtonLink>

                {!meetsMin && (
                  <p className="text-center text-xs text-muted-foreground">
                    Min order ₹{cart.store.minOrderAmount}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <CartStoreConflictModal />
      </PageShell>
    </AuthGuard>
  );
}
