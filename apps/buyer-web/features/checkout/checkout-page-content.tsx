'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { AddressForm } from '@/features/checkout/components/address-form';
import { PaymentMethodSelector } from '@/features/checkout/components/payment-method-selector';
import { CheckoutSummary } from '@/features/checkout/components/checkout-summary';
import { CouponPanel } from '@/features/checkout/components/coupon-panel';
import { DeliverabilityPanel } from '@/features/checkout/components/deliverability-panel';
import { WalletCheckoutPanel } from '@/features/checkout/components/wallet-checkout-panel';
import { RazorpayButton } from '@/features/checkout/components/razorpay-button';
import { ActionBar, Button, Spinner } from '@/design-system/primitives';
import { useCartQuery } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';
import { getDefaultSavedDeliveryAddress } from '@/lib/saved-delivery-address';
import { useInitiateCodCheckoutMutation, useInitiateCheckoutMutation } from '@/hooks/use-checkout';
import { useCheckoutStore } from '@/store/checkout-store';
import { useToast } from '@/design-system/primitives';
import { SessionError } from '@/services/auth/auth-api';

export function CheckoutPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: cart, isLoading } = useCartQuery();
  const {
    step,
    paymentMethod,
    deliveryAddress,
    buyerNote,
    walletAmountToUse,
    rewardPointsToRedeem,
    checkoutId,
    setStep,
    setPaymentMethod,
    setBuyerNote,
    setWalletAmountToUse,
    setRewardPointsToRedeem,
    setCheckoutId,
    setConfirmed,
    reset,
  } = useCheckoutStore();

  const initiateCod = useInitiateCodCheckoutMutation();
  const initiateOnline = useInitiateCheckoutMutation();
  const [openRazorpayAfterInit, setOpenRazorpayAfterInit] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);

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
    if (!isLoading && (!cart || cart.items.length === 0)) {
      router.replace('/cart');
    }
  }, [isLoading, cart, router]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) return;

    const payload = {
      deliveryAddress,
      buyerNote: buyerNote || undefined,
      walletAmountToUse: walletAmountToUse || undefined,
      rewardPointsToRedeem: rewardPointsToRedeem || undefined,
    };

    if (paymentMethod === 'COD') {
      setStep('processing');
      try {
        const result = await initiateCod.mutateAsync(payload);
        setConfirmed(result.orderId, result.orderNumber);
        router.replace(`/orders/${result.orderId}/confirmation`);
        reset();
      } catch (err) {
        setStep('payment');
        toast(err instanceof SessionError ? err.message : 'Failed to place order', 'error');
      }
    } else {
      setStep('processing');
      try {
        const checkout = await initiateOnline.mutateAsync(payload);
        const id = checkout.id || checkout.checkoutId;
        if (!id) {
          throw new SessionError('Checkout could not be started. Please try again.', 500);
        }
        setCheckoutId(id);
        setOpenRazorpayAfterInit(true);
        setStep('payment');
      } catch (err) {
        setStep('payment');
        toast(err instanceof SessionError ? err.message : 'Failed to initiate checkout', 'error');
      }
    }
  };

  const handleRazorpaySuccess = (orderId: string, orderNumber: string) => {
    setConfirmed(orderId, orderNumber);
    router.replace(`/orders/${orderId}/confirmation`);
    reset();
  };

  if (isLoading || !checkoutReady) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  if (!cart || cart.items.length === 0) return null;

  const renderPaymentCta = () =>
    paymentMethod === 'COD' ? (
      <Button
        fullWidth
        loading={initiateCod.isPending}
        onClick={handlePlaceOrder}
        className="text-base"
      >
        Place order · {formatCurrency(cart.totals.grandTotal)}
      </Button>
    ) : checkoutId ? (
      <RazorpayButton
        checkoutId={checkoutId}
        autoOpen={openRazorpayAfterInit}
        onAutoOpenComplete={() => setOpenRazorpayAfterInit(false)}
        onSuccess={handleRazorpaySuccess}
        onFailure={() => setStep('payment')}
      />
    ) : (
      <Button
        fullWidth
        loading={initiateOnline.isPending}
        onClick={handlePlaceOrder}
        className="text-base"
      >
        Proceed to payment · {formatCurrency(cart.totals.grandTotal)}
      </Button>
    );

  const showPayBar = step === 'payment';

  return (
    <AuthGuard>
      <PageShell hideMobileNav>
        <div className={`space-y-5 lg:pb-0 ${showPayBar ? 'pb-28' : 'pb-6'}`}>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Checkout</h1>
            <CheckoutSteps step={step} />
          </div>

          {step === 'processing' && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Processing your order…</p>
              </div>
            </div>
          )}

          {step !== 'processing' && (
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <StepBadge num={1} done={step === 'payment' || step === 'done'} />
                    <h2 className="text-lg font-semibold">Delivery address</h2>
                  </div>
                  {step === 'address' ? (
                    <AddressForm onNext={() => setStep('payment')} />
                  ) : (
                    deliveryAddress && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{deliveryAddress.line1}</p>
                          {deliveryAddress.line2 && <p>{deliveryAddress.line2}</p>}
                          <p>
                            {deliveryAddress.city}, {deliveryAddress.pincode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep('address')}
                          className="shrink-0 text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )
                  )}
                </div>

                {step === 'payment' && (
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <StepBadge num={2} done={false} />
                      <h2 className="text-lg font-semibold">Payment</h2>
                    </div>

                    <WalletCheckoutPanel
                      walletAmountToUse={walletAmountToUse}
                      rewardPointsToRedeem={rewardPointsToRedeem}
                      onWalletChange={setWalletAmountToUse}
                      onPointsChange={setRewardPointsToRedeem}
                    />

                    <div className="mt-4">
                      <PaymentMethodSelector
                        value={paymentMethod}
                        onChange={(method) => {
                          setPaymentMethod(method);
                          setCheckoutId(null);
                          setOpenRazorpayAfterInit(false);
                        }}
                      />
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="buyer-note"
                        className="block text-sm font-medium text-foreground"
                      >
                        Order note (optional)
                      </label>
                      <textarea
                        id="buyer-note"
                        value={buyerNote}
                        onChange={(e) => setBuyerNote(e.target.value)}
                        maxLength={300}
                        rows={2}
                        placeholder="e.g. Please ring the bell"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Desktop CTA; mobile uses sticky ActionBar */}
                    <div className="mt-5 hidden lg:block">{renderPaymentCta()}</div>
                  </div>
                )}
              </div>

              {deliveryAddress && (
                <div className="space-y-4 lg:sticky lg:top-24">
                  <DeliverabilityPanel
                    storeId={cart.storeId}
                    lat={deliveryAddress.lat}
                    lng={deliveryAddress.lng}
                    pincode={deliveryAddress.pincode}
                  />
                  <CouponPanel cart={cart} />
                  <CheckoutSummary cart={cart} address={deliveryAddress} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile sticky pay bar */}
        {showPayBar && (
          <ActionBar position="flush" mobileOnly={false} className="lg:hidden">
            <div className="min-w-0 shrink-0">
              <p className="text-[11px] text-jd-text-muted">Total</p>
              <p className="text-lg font-bold text-jd-text-primary">
                {formatCurrency(cart.totals.grandTotal)}
              </p>
            </div>
            <div className="flex-1">{renderPaymentCta()}</div>
          </ActionBar>
        )}
      </PageShell>
    </AuthGuard>
  );
}

const STEP_ITEMS = [
  { key: 'address', label: 'Address' },
  { key: 'payment', label: 'Payment' },
] as const;

function CheckoutSteps({ step }: { step: string }) {
  const activeIndex = step === 'address' ? 0 : 1;
  return (
    <ol className="mt-3 flex items-center gap-2" aria-label="Checkout progress">
      {STEP_ITEMS.map((item, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={item.key} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-primary text-primary-foreground'
                  : active
                    ? 'bg-primary/15 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {done ? <CheckCircle className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={`text-xs font-medium ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.label}
            </span>
            {i < STEP_ITEMS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepBadge({ num, done }: { num: number; done: boolean }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}
    >
      {done ? <CheckCircle className="h-4 w-4" aria-hidden /> : num}
    </div>
  );
}
