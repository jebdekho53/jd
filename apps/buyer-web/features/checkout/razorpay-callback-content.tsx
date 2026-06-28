'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { Spinner } from '@/design-system/primitives';
import { useSyncPaymentMutation, useVerifyPaymentMutation } from '@/hooks/use-checkout';
import { useCheckoutStore } from '@/store/checkout-store';
import { useToast } from '@/design-system/primitives';
import { RAZORPAY_CHECKOUT_SESSION_KEY } from '@/lib/pwa/standalone';

export function RazorpayCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verify = useVerifyPaymentMutation();
  const sync = useSyncPaymentMutation();
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

    const finish = (orderId: string, orderNumber: string) => {
      sessionStorage.removeItem(RAZORPAY_CHECKOUT_SESSION_KEY);
      setConfirmed(orderId, orderNumber);
      reset();
      toast('Payment successful!', 'success');
      router.replace(`/orders/${orderId}/confirmation`);
    };

    void verify
      .mutateAsync({
        checkoutId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      })
      .then((result) => finish(result.orderId, result.orderNumber))
      .catch(() =>
        sync
          .mutateAsync(checkoutId)
          .then((result) => finish(result.orderId, result.orderNumber))
          .catch(() => {
            toast(
              'Payment verification failed. If amount was deducted, check your orders shortly or contact support.',
              'error',
            );
            router.replace('/checkout');
          }),
      );
  }, [router, searchParams, setConfirmed, reset, toast, verify, sync]);

  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-jd-text-muted">Confirming your payment…</p>
      </div>
    </PageShell>
  );
}
