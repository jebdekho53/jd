'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, UtensilsCrossed } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { AddressForm } from '@/features/checkout/components/address-form';
import { ActionBar, Button, Spinner, useToast } from '@/design-system/primitives';
import { useFoodCartQuery } from '@/hooks/use-food-cart';
import { initiateFoodCodCheckout } from '@/services/food/food-api';
import { useCheckoutStore } from '@/store/checkout-store';
import { getDefaultSavedDeliveryAddress } from '@/lib/saved-delivery-address';
import { formatCurrency } from '@/lib/utils';
import { SessionError } from '@/services/auth/auth-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { foodCartKeys } from '@/hooks/use-food-cart';
import { orderKeys } from '@/hooks/use-orders';
import type { DeliveryAddress } from '@/types/checkout';

function deliveryToFoodPayload(addr: DeliveryAddress) {
  return {
    deliveryAddress: addr as unknown as Record<string, unknown>,
    deliveryLat: addr.lat,
    deliveryLng: addr.lng,
    paymentMethod: 'COD' as const,
  };
}

export function FoodCheckoutPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: cart, isLoading } = useFoodCartQuery();
  const { step, deliveryAddress, setStep, setDeliveryAddress, reset } = useCheckoutStore();
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string; orderNumber: string } | null>(null);

  const placeOrder = useMutation({
    mutationFn: () => {
      if (!deliveryAddress) throw new Error('Delivery address required');
      return initiateFoodCodCheckout(deliveryToFoodPayload(deliveryAddress));
    },
    onSuccess: (result) => {
      qc.setQueryData(foodCartKeys.current(), null);
      qc.invalidateQueries({ queryKey: orderKeys.all });
      setOrderPlaced({ orderId: result.orderId, orderNumber: result.orderNumber });
      reset();
    },
  });

  useEffect(() => {
    const applySavedAddress = () => {
      const state = useCheckoutStore.getState();
      if (!state.deliveryAddress) {
        const saved = getDefaultSavedDeliveryAddress();
        if (saved) {
          state.setDeliveryAddress(saved);
          state.setStep('payment');
        }
      } else if (state.step === 'address') {
        state.setStep('payment');
      }
      setCheckoutReady(true);
    };

    if (useCheckoutStore.persist.hasHydrated()) {
      applySavedAddress();
      return;
    }

    return useCheckoutStore.persist.onFinishHydration(applySavedAddress);
  }, []);

  useEffect(() => {
    if (!isLoading && (!cart || cart.items.length === 0) && !orderPlaced) {
      router.replace('/food/cart');
    }
  }, [isLoading, cart, router, orderPlaced]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || !cart) return;
    try {
      await placeOrder.mutateAsync();
      toast('Order placed successfully', 'success');
    } catch (err) {
      const message = err instanceof SessionError ? err.message : 'Checkout failed';
      toast(message, 'error');
    }
  };

  if (orderPlaced) {
    return (
      <PageShell hideFloatingCart>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle className="h-9 w-9" aria-hidden />
          </div>
          <h1 className="text-xl font-bold">Order placed!</h1>
          <p className="text-sm text-jd-text-muted">
            Order <span className="font-semibold text-jd-text-primary">{orderPlaced.orderNumber}</span>{' '}
            is confirmed. Pay cash on delivery when your food arrives.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => router.push(`/orders/${orderPlaced.orderId}`)}>
              Track order
            </Button>
            <Button variant="outline" onClick={() => router.push('/food')}>
              Order more food
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!checkoutReady || isLoading || !cart) {
    return (
      <PageShell hideFloatingCart>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  return (
    <AuthGuard redirectTo="/login">
      <PageShell hideFloatingCart hideMobileNav>
        <div className="mx-auto max-w-2xl space-y-6 pb-28">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <UtensilsCrossed className="h-6 w-6 text-primary" aria-hidden />
              Food checkout
            </h1>
            <p className="mt-1 text-sm text-jd-text-muted">
              {cart.itemCount} items from {cart.store.name}
            </p>
          </div>

          {step === 'address' && (
            <AddressForm
              onNext={() => {
                const addr = useCheckoutStore.getState().deliveryAddress;
                if (addr) setDeliveryAddress(addr);
                setStep('payment');
              }}
            />
          )}

          {step === 'payment' && deliveryAddress && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Delivery address</h2>
                <p className="mt-2 text-sm text-jd-text-secondary">
                  {deliveryAddress.line1}
                  {deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}
                  <br />
                  {deliveryAddress.locality}, {deliveryAddress.city} — {deliveryAddress.pincode}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Change address
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Payment</h2>
                <p className="mt-2 text-sm text-jd-text-secondary">
                  Cash on delivery (COD) — pay when your order arrives.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Order summary</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-jd-text-muted">Subtotal</dt>
                    <dd>{formatCurrency(cart.totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-jd-text-muted">Fees & tax</dt>
                    <dd>
                      {formatCurrency(
                        cart.totals.packagingFee + cart.totals.deliveryFee + cart.totals.tax,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <dt>Total</dt>
                    <dd>{formatCurrency(cart.totals.grandTotal)}</dd>
                  </div>
                </dl>
              </div>

              <ActionBar>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={placeOrder.isPending}
                >
                  {placeOrder.isPending ? 'Placing order…' : `Place order · ${formatCurrency(cart.totals.grandTotal)}`}
                </Button>
              </ActionBar>
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
