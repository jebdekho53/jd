'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { CartItem } from '@/features/cart/components/cart-item';
import { CartSummary } from '@/features/cart/components/cart-summary';
import { CartEmpty } from '@/features/cart/components/cart-empty';
import { CartSkeleton } from '@/features/cart/components/cart-skeleton';
import { CartStoreConflictModal } from '@/features/cart/components/cart-store-conflict-modal';
import { ButtonLink, Container, Text } from '@/design-system/primitives';
import { useCartQuery, useClearCartMutation } from '@/hooks/use-cart';
import { useToast } from '@/design-system/primitives';

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
      <div className="s2-root min-h-screen bg-neutral-50 pb-32">
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-4">
          <Container>
            <div className="flex items-center justify-between">
              <Text variant="h2" as="h1">
                Your cart
              </Text>
              {cart && cart.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={clearCart.isPending}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </Container>
        </div>

        <Container className="py-4">
          {isLoading ? (
            <CartSkeleton />
          ) : !cart || cart.items.length === 0 ? (
            <CartEmpty />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              {/* Items */}
              <div className="rounded-xl bg-white shadow-sm">
                <div className="border-b border-neutral-100 px-4 py-3">
                  <Link href={`/stores/${cart.store.slug}`} className="group flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-neutral-500" />
                    <Text variant="label" className="group-hover:underline">
                      {cart.store.name}
                    </Text>
                  </Link>
                </div>
                <div className="divide-y divide-neutral-100 px-4">
                  {cart.items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Summary + CTA */}
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <Text variant="label" className="mb-3 block">
                    Order summary
                  </Text>
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
                  <Text variant="caption" className="text-center">
                    Min order ₹{cart.store.minOrderAmount}
                  </Text>
                )}
              </div>
            </div>
          )}
        </Container>

        <CartStoreConflictModal />
      </div>
    </AuthGuard>
  );
}
