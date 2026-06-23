'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { AddressForm } from '@/features/checkout/components/address-form';
import { PaymentMethodSelector } from '@/features/checkout/components/payment-method-selector';
import { CheckoutSummary } from '@/features/checkout/components/checkout-summary';
import { RazorpayButton } from '@/features/checkout/components/razorpay-button';
import { Button, Container, Spinner, Text } from '@/design-system/primitives';
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
    checkoutId,
    setStep,
    setPaymentMethod,
    setBuyerNote,
    setCheckoutId,
    setConfirmed,
    reset,
  } = useCheckoutStore();

  const initiateCod = useInitiateCodCheckoutMutation();
  const initiateOnline = useInitiateCheckoutMutation();

  // Redirect to cart if empty
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
      // Online: initiate checkout first
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
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return null;

  return (
    <AuthGuard>
      <div className="s2-root min-h-screen bg-neutral-50 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-4">
          <Container>
            <Text variant="h2" as="h1">
              Checkout
            </Text>
          </Container>
        </div>

        {step === 'processing' && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-4" />
              <Text variant="body">Processing your order…</Text>
            </div>
          </div>
        )}

        {step !== 'processing' && (
          <Container size="md" className="py-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left — steps */}
              <div className="space-y-6">
                {/* Step 1 — Address */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <StepBadge num={1} done={step === 'payment' || step === 'done'} />
                    <Text variant="h2">Delivery address</Text>
                  </div>
                  {step === 'address' ? (
                    <AddressForm onNext={() => setStep('payment')} />
                  ) : (
                    deliveryAddress && (
                      <div className="flex items-start justify-between">
                        <div>
                          <Text variant="bodySm">{deliveryAddress.line1}</Text>
                          <Text variant="bodySm">
                            {deliveryAddress.city}, {deliveryAddress.pincode}
                          </Text>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep('address')}
                          className="text-sm font-medium text-emerald-700 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* Step 2 — Payment */}
                {step === 'payment' && (
                  <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <StepBadge num={2} done={false} />
                      <Text variant="h2">Payment</Text>
                    </div>

                    <PaymentMethodSelector
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                    />

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-700">
                        Order note (optional)
                      </label>
                      <textarea
                        value={buyerNote}
                        onChange={(e) => setBuyerNote(e.target.value)}
                        maxLength={300}
                        rows={2}
                        placeholder="e.g. Please ring the bell"
                        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

              {/* Right — summary */}
              {deliveryAddress && (
                <CheckoutSummary cart={cart} address={deliveryAddress} />
              )}
            </div>
          </Container>
        )}
      </div>
    </AuthGuard>
  );
}

function StepBadge({ num, done }: { num: number; done: boolean }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-700'
      }`}
    >
      {done ? <CheckCircle className="h-4 w-4" /> : num}
    </div>
  );
}
