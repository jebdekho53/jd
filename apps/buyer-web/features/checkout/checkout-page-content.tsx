'use client';

import { useEffect } from 'react';
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
import { Button, Spinner } from '@/design-system/primitives';
import { useCartQuery } from '@/hooks/use-cart';
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
        setCheckoutId(checkout.id);
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

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  if (!cart || cart.items.length === 0) return null;

  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm address and payment to place your order
            </p>
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
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <StepBadge num={1} done={step === 'payment' || step === 'done'} />
                    <h2 className="text-lg font-semibold">Delivery address</h2>
                  </div>
                  {step === 'address' ? (
                    <AddressForm onNext={() => setStep('payment')} />
                  ) : (
                    deliveryAddress && (
                      <div className="flex items-start justify-between">
                        <div className="text-sm text-muted-foreground">
                          <p>{deliveryAddress.line1}</p>
                          <p>
                            {deliveryAddress.city}, {deliveryAddress.pincode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep('address')}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )
                  )}
                </div>

                {step === 'payment' && (
                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
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
                        onChange={setPaymentMethod}
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

                    <div className="mt-5">
                      {paymentMethod === 'COD' ? (
                        <Button
                          fullWidth
                          loading={initiateCod.isPending}
                          onClick={handlePlaceOrder}
                          className="text-base"
                        >
                          Place order (Cash on delivery)
                        </Button>
                      ) : checkoutId ? (
                        <RazorpayButton
                          checkoutId={checkoutId}
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
                          Proceed to payment
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {deliveryAddress && (
                <div className="space-y-4">
                  <DeliverabilityPanel
                    storeId={cart.storeId}
                    lat={deliveryAddress.lat}
                    lng={deliveryAddress.lng}
                  />
                  <CouponPanel cart={cart} />
                  <CheckoutSummary cart={cart} address={deliveryAddress} />
                </div>
              )}
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
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
