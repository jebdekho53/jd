'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { ActionBar, ButtonLink, useToast } from '@/design-system/primitives';
import {
  useClearFoodCartMutation,
  useFoodCartQuery,
  useRemoveFoodCartItemMutation,
  useUpdateFoodCartItemMutation,
} from '@/hooks/use-food-cart';
import { formatCurrency, cn } from '@/lib/utils';

function FoodCartSkeleton() {
  return <div className="h-48 animate-pulse rounded-2xl bg-muted" />;
}

export function FoodCartPageContent() {
  const { toast } = useToast();
  const { data: cart, isLoading, isFetching } = useFoodCartQuery();
  const updateItem = useUpdateFoodCartItemMutation();
  const removeItem = useRemoveFoodCartItemMutation();
  const clearCart = useClearFoodCartMutation();

  const hasItems = Boolean(cart && cart.items.length > 0);
  const meetsMin = cart ? cart.totals.subtotal >= cart.store.minOrderAmount : false;
  const bootstrapping = (isLoading || isFetching) && !cart;

  const handleClear = async () => {
    if (!confirm('Clear your food cart?')) return;
    try {
      await clearCart.mutateAsync();
      toast('Food cart cleared', 'info');
    } catch {
      toast('Failed to clear cart', 'error');
    }
  };

  return (
    <AuthGuard redirectTo="/login">
      <PageShell hideMobileNav={hasItems} hideFloatingCart>
        <div className="mx-auto max-w-2xl space-y-5 pb-24 lg:pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
                <UtensilsCrossed className="h-6 w-6 text-primary" aria-hidden />
                Food cart
              </h1>
              {hasItems && cart && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} from {cart.store.name}
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

          {bootstrapping ? (
            <FoodCartSkeleton />
          ) : !hasItems ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="h-7 w-7" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-jd-text-primary">Your food cart is empty</p>
                <p className="mt-1 text-sm text-jd-text-muted">
                  Browse restaurants and add dishes to order.
                </p>
              </div>
              <ButtonLink href="/food" variant="primary">
                Explore food
              </ButtonLink>
            </div>
          ) : (
            cart && (
              <>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="border-b border-border bg-cream-3 px-4 py-3">
                    <Link
                      href={`/restaurant/${cart.store.slug}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {cart.store.name}
                    </Link>
                  </div>
                  <ul className="divide-y divide-border">
                    {cart.items.map((item) => {
                      const images = item.menuItem.imageUrls ?? [];
                      return (
                        <li key={item.id} className="flex gap-3 px-4 py-3">
                          {images[0] ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-3">
                              <Image src={images[0]} alt="" fill className="object-cover" sizes="56px" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cream-3 text-lg font-bold text-primary/30">
                              {item.menuItem.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{item.menuItem.name}</p>
                            {item.variantName && (
                              <p className="text-xs text-jd-text-muted">{item.variantName}</p>
                            )}
                            {item.addons.length > 0 && (
                              <p className="text-[11px] text-jd-text-muted">
                                + {item.addons.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            <p className="mt-1 text-sm font-semibold">{formatCurrency(item.lineTotal)}</p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <div className="flex items-center gap-1 rounded-lg border border-border">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => {
                                  const next = item.quantity - 1;
                                  if (next <= 0) removeItem.mutate(item.id);
                                  else updateItem.mutate({ itemId: item.id, quantity: next });
                                }}
                                className="p-1.5 text-jd-text-muted hover:text-primary"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                                }
                                className="p-1.5 text-jd-text-muted hover:text-primary"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <h2 className="text-sm font-semibold text-jd-text-primary">Bill details</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-jd-text-muted">Item total</dt>
                      <dd>{formatCurrency(cart.totals.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-jd-text-muted">Packaging</dt>
                      <dd>{formatCurrency(cart.totals.packagingFee)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-jd-text-muted">Delivery fee</dt>
                      <dd>{formatCurrency(cart.totals.deliveryFee)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-jd-text-muted">Taxes</dt>
                      <dd>{formatCurrency(cart.totals.tax)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                      <dt>Grand total</dt>
                      <dd>{formatCurrency(cart.totals.grandTotal)}</dd>
                    </div>
                  </dl>
                  {!meetsMin && (
                    <p className="mt-3 text-xs text-destructive">
                      Minimum order is {formatCurrency(cart.store.minOrderAmount)}. Add more items to checkout.
                    </p>
                  )}
                </div>

                <ActionBar className="lg:static lg:border-0 lg:bg-transparent lg:p-0">
                  <ButtonLink
                    href="/food/checkout"
                    variant="primary"
                    className={cn('w-full', !meetsMin && 'pointer-events-none opacity-50')}
                    aria-disabled={!meetsMin}
                  >
                    Proceed to checkout · {formatCurrency(cart.totals.grandTotal)}
                  </ButtonLink>
                </ActionBar>
              </>
            )
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
