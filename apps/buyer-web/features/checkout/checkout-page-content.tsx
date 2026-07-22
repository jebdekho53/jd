'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { AddressForm } from '@/features/checkout/components/address-form';
import { PaymentMethodSelector } from '@/features/checkout/components/payment-method-selector';
import { CheckoutSummary } from '@/features/checkout/components/checkout-summary';
import { CheckoutReturnPolicyPanel } from '@/features/checkout/components/checkout-return-policy-panel';
import { CouponPanel } from '@/features/checkout/components/coupon-panel';
import { CheckoutRequirementsHint } from '@/features/checkout/components/checkout-requirements-hint';
import { DeliverabilityPanel } from '@/features/checkout/components/deliverability-panel';
import { WalletCheckoutPanel } from '@/features/checkout/components/wallet-checkout-panel';
import { RazorpayButton } from '@/features/checkout/components/razorpay-button';
import { PayerContactForm } from '@/features/checkout/components/payer-contact-form';
import { PwaPaymentBanner } from '@/components/pwa/pwa-payment-banner';
import { ActionBar, Button, ButtonLink, Spinner } from '@/design-system/primitives';
import { CartEmpty } from '@/features/cart/components/cart-empty';
import { useCartQuery } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';
import { trackReach } from '@/lib/analytics/track';
import { getDefaultSavedDeliveryAddress, isDeliveryAddressComplete } from '@/lib/saved-delivery-address';
import { useInitiateCodCheckoutMutation, useInitiateCheckoutMutation } from '@/hooks/use-checkout';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { useCheckoutStore } from '@/store/checkout-store';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/design-system/primitives';
import { SessionError } from '@/services/auth/auth-api';
import type { DeliveryAddress, PayerContact, PaymentMethod } from '@/types/checkout';

function getCheckoutRequirements(options: {
  deliveryAddress: DeliveryAddress | null;
  paymentMethod: PaymentMethod;
  deliverabilityLoading: boolean;
  isDeliverable: boolean;
  payerContact: PayerContact | null;
}): string[] {
  const items: string[] = [];
  const { deliveryAddress, paymentMethod, deliverabilityLoading, isDeliverable, payerContact } =
    options;

  if (!deliveryAddress || !isDeliveryAddressComplete(deliveryAddress)) {
    items.push('Delivery address: house no., area, city, PIN code, and map pin');
  }
  if (paymentMethod === 'COD') {
    if (deliverabilityLoading) {
      items.push('Checking if this store delivers to your address…');
    } else if (!isDeliverable) {
      items.push('This address is outside the store delivery zone');
    }
  }
  if (paymentMethod === 'RAZORPAY' && !payerContact) {
    items.push('Payment contact: full name, email, and 10-digit mobile');
  }
  return items;
}

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
  const { data: profile } = useProfileQuery();
  const [openRazorpayAfterInit, setOpenRazorpayAfterInit] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [payerContact, setPayerContact] = useState<PayerContact | null>(null);
  const [isDeliverable, setIsDeliverable] = useState(false);
  const [deliverabilityLoading, setDeliverabilityLoading] = useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);

  const handleDeliverabilityChange = useCallback((deliverable: boolean, loading: boolean) => {
    setIsDeliverable(deliverable);
    setDeliverabilityLoading(loading);
  }, []);

  useEffect(() => {
    const applySavedAddress = () => {
      const state = useCheckoutStore.getState();
      if (!state.deliveryAddress) {
        const saved = getDefaultSavedDeliveryAddress();
        if (saved) {
          state.setDeliveryAddress(saved);
          state.setStep('payment');
        }
      } else if (
        state.step === 'address' &&
        isDeliveryAddressComplete(state.deliveryAddress)
      ) {
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
    if (!checkoutReady || authLoading || isLoading) return;
    if (!isAuthenticated) return;
  }, [checkoutReady, authLoading, isLoading, isAuthenticated, cart, router]);

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      trackReach('CHECKOUT_START', { storeId: cart.storeId }, cart.id);
    }
  }, [cart?.id, cart?.items.length]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) return;

    if (!isDeliveryAddressComplete(deliveryAddress)) {
      toast('Please confirm your delivery address on the map', 'error');
      setStep('address');
      return;
    }

    if (paymentMethod === 'COD' && (deliverabilityLoading || !isDeliverable)) {
      toast('This address is not deliverable from this store', 'error');
      return;
    }

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
        toast('Order placed successfully', 'success');
        router.replace(`/orders/${result.orderId}/track`);
        reset();
      } catch (err) {
        setStep('payment');
        toast(err instanceof SessionError ? err.message : 'Failed to place order', 'error');
      }
    } else {
      if (!payerContact) {
        toast('Enter your name, email, and mobile for payment', 'error');
        return;
      }
      setStep('processing');
      try {
        const checkout = await initiateOnline.mutateAsync({
          ...payload,
          payerContact,
        });
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
    toast('Order placed successfully', 'success');
    router.replace(`/orders/${orderId}/track`);
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

  if (!cart || cart.items.length === 0) {
    return (
      <AuthGuard>
        <PageShell>
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">Checkout</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your cart needs items before checkout can continue.
              </p>
            </div>
            <CartEmpty />
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/cart" variant="outline">Open cart</ButtonLink>
              <ButtonLink href="/">Continue shopping</ButtonLink>
            </div>
          </div>
        </PageShell>
      </AuthGuard>
    );
  }

  const onlinePayReady = paymentMethod !== 'RAZORPAY' || Boolean(payerContact);
  const codBlocked =
    paymentMethod === 'COD' &&
    (!deliveryAddress ||
      !isDeliveryAddressComplete(deliveryAddress) ||
      deliverabilityLoading ||
      !isDeliverable ||
      cart?.delivery?.mode === 'SELF');

  const checkoutRequirements =
    step === 'payment'
      ? getCheckoutRequirements({
          deliveryAddress,
          paymentMethod,
          deliverabilityLoading,
          isDeliverable,
          payerContact,
        })
      : [];

  const paymentBlocked =
    (paymentMethod === 'COD' && codBlocked) ||
    (paymentMethod === 'RAZORPAY' && !checkoutId && !onlinePayReady);

  const renderPaymentCta = () =>
    paymentMethod === 'COD' ? (
      <Button
        fullWidth
        loading={initiateCod.isPending}
        disabled={codBlocked}
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
        disabled={!onlinePayReady}
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
                  ) : deliveryAddress ? (
                    <div className="space-y-3">
                      {!isDeliveryAddressComplete(deliveryAddress) && (
                        <CheckoutRequirementsHint
                          items={[
                            'Delivery address is incomplete — edit and confirm map pin',
                          ]}
                        />
                      )}
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
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <CheckoutRequirementsHint
                        items={['Add a delivery address to continue checkout']}
                      />
                      <Button variant="outline" onClick={() => setStep('address')}>
                        Add address
                      </Button>
                    </div>
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
                        codDisabled={cart?.delivery?.mode === 'SELF'}
                        onChange={(method) => {
                          setPaymentMethod(method);
                          setCheckoutId(null);
                          setOpenRazorpayAfterInit(false);
                        }}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {cart?.delivery?.mode === 'SELF'
                          ? 'This store delivers itself — online payment only.'
                          : 'Choose how you want to pay. COD requires a deliverable address.'}
                      </p>
                    </div>

                    {paymentMethod === 'RAZORPAY' && (
                      <div className="mt-4">
                        <PwaPaymentBanner />
                        <PayerContactForm
                          value={payerContact}
                          onChange={setPayerContact}
                          defaultName={profile?.displayName}
                          defaultEmail={profile?.email}
                          defaultPhone={profile?.phone}
                        />
                      </div>
                    )}

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

                    {paymentBlocked && checkoutRequirements.length > 0 && (
                      <CheckoutRequirementsHint items={checkoutRequirements} className="mt-4" />
                    )}

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
                    onDeliverabilityChange={handleDeliverabilityChange}
                  />
                  <CouponPanel cart={cart} />
                  <CheckoutReturnPolicyPanel items={cart.items} />
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
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {paymentBlocked && checkoutRequirements.length > 0 && (
                <p className="line-clamp-2 text-[11px] text-amber-800">
                  {checkoutRequirements[0]}
                </p>
              )}
              {renderPaymentCta()}
            </div>
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
