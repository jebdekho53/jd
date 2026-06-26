'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { Spinner } from '@/design-system/primitives';
import { useVerifyPaymentMutation } from '@/hooks/use-checkout';
import { useCheckoutStore } from '@/store/checkout-store';
import { useToast } from '@/design-system/primitives';
import { RAZORPAY_CHECKOUT_SESSION_KEY } from '@/lib/pwa/standalone';

export function RazorpayCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verify = useVerifyPaymentMutation();
  const { toast } = useToast();
  const { setConfirmed, reset } = useCheckoutStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const checkoutId = sessionStorage.getItem(RAZORPAY_CHECKOUT_SESSION_KEY);
    const razorpayPaymentId = searchParams.get('razorpay_payment_id');
    const razorpayOrderId = searchParams.get('razorpay_order_id');
    const razorpaySignature = searchParams.get('razorpay_signature');

    if (!checkoutId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      toast('Payment details missing. Please try again.', 'error');
      router.replace('/checkout');
      return;
    }

    void verify
      .mutateAsync({
        checkoutId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      })
      .then((result) => {
        sessionStorage.removeItem(RAZORPAY_CHECKOUT_SESSION_KEY);
        setConfirmed(result.orderId, result.orderNumber);
        reset();
        toast('Payment successful!', 'success');
        router.replace(`/orders/${result.orderId}/confirmation`);
      })
      .catch(() => {
        toast('Payment verification failed. Contact support if amount was deducted.', 'error');
        router.replace('/checkout');
      });
  }, [router, searchParams, setConfirmed, reset, toast, verify]);

  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-jd-text-muted">Confirming your payment…</p>
      </div>
    </PageShell>
  );
}
