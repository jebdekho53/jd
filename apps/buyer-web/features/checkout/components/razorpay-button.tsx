'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/design-system/primitives';
import { useCreateRazorpayOrderMutation, useVerifyPaymentMutation } from '@/hooks/use-checkout';
import { useToast } from '@/design-system/primitives';
import type { RazorpayOrderResult } from '@/types/checkout';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

interface RazorpayButtonProps {
  checkoutId: string;
  onSuccess: (orderId: string, orderNumber: string) => void;
  onFailure?: (error: string) => void;
  /** Open Razorpay modal as soon as checkout is ready (single-step pay flow) */
  autoOpen?: boolean;
  onAutoOpenComplete?: () => void;
}

export function RazorpayButton({
  checkoutId,
  onSuccess,
  onFailure,
  autoOpen = false,
  onAutoOpenComplete,
}: RazorpayButtonProps) {
  const createOrder = useCreateRazorpayOrderMutation();
  const verifyPayment = useVerifyPaymentMutation();
  const { toast } = useToast();

  useEffect(() => {
    // Preload Razorpay script
    loadRazorpayScript();
  }, []);

  const handlePay = useCallback(async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast('Could not load payment gateway. Check your connection and try again.', 'error');
      onFailure?.('Script load failed');
      return;
    }

    let orderData: RazorpayOrderResult;
    try {
      orderData = await createOrder.mutateAsync(checkoutId);
    } catch {
      toast('Failed to create payment order. Please try again.', 'error');
      return;
    }

    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.razorpayOrderId,
      name: 'Jebdekho',
      description: `Order ${orderData.orderNumber}`,
      prefill: {
        name: orderData.buyerName,
        contact: orderData.buyerPhone,
      },
      theme: { color: '#059669' },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const result = await verifyPayment.mutateAsync({
            checkoutId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast('Payment successful!', 'success');
          onSuccess(result.orderId, result.orderNumber);
        } catch {
          toast('Payment verification failed. Contact support.', 'error');
          onFailure?.('Verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled', 'info');
        },
      },
    });

    rzp.open();
  }, [checkoutId, createOrder, verifyPayment, toast, onSuccess, onFailure]);

  const busy = createOrder.isPending || verifyPayment.isPending;
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (!autoOpen || !checkoutId || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    void handlePay().finally(() => onAutoOpenComplete?.());
  }, [autoOpen, checkoutId, handlePay, onAutoOpenComplete]);

  return (
    <Button fullWidth loading={busy} onClick={handlePay} className="text-base">
      Pay now with Razorpay
    </Button>
  );
}
