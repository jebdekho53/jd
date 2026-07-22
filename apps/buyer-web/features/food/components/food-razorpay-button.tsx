'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/design-system/primitives';
import {
  useCreateFoodRazorpayOrderMutation,
  useSyncFoodPaymentMutation,
  useVerifyFoodPaymentMutation,
} from '@/hooks/use-food-checkout';
import { useToast } from '@/design-system/primitives';
import {
  isStandalonePwa,
  RAZORPAY_CHECKOUT_SESSION_KEY,
  razorpayCallbackUrl,
} from '@/lib/pwa/standalone';
import type { FoodRazorpayOrderResult } from '@/types/food';

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

interface FoodRazorpayButtonProps {
  checkoutId: string;
  storeName: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  onSuccess: (orderId: string, orderNumber: string) => void;
  onFailure?: (error: string) => void;
  autoOpen?: boolean;
  onAutoOpenComplete?: () => void;
}

/**
 * Food's twin of features/checkout/components/razorpay-button.tsx. Kept separate
 * rather than made generic because the food verify/sync endpoints use a
 * different field name (foodCheckoutId) and a leaner create-order response
 * (no orderNumber/buyer* on first call) than the grocery ones.
 */
export function FoodRazorpayButton({
  checkoutId,
  storeName,
  buyerName,
  buyerEmail,
  buyerPhone,
  onSuccess,
  onFailure,
  autoOpen = false,
  onAutoOpenComplete,
}: FoodRazorpayButtonProps) {
  const createOrder = useCreateFoodRazorpayOrderMutation();
  const verifyPayment = useVerifyFoodPaymentMutation();
  const syncPayment = useSyncFoodPaymentMutation();
  const { toast } = useToast();
  const payFlowActiveRef = useRef(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const confirmPayment = useCallback(
    async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const result = await verifyPayment.mutateAsync({
          foodCheckoutId: checkoutId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        toast('Payment successful!', 'success');
        onSuccess(result.orderId, result.orderNumber);
        return;
      } catch {
        try {
          const synced = await syncPayment.mutateAsync(checkoutId);
          toast('Payment confirmed!', 'success');
          onSuccess(synced.orderId, synced.orderNumber);
          return;
        } catch {
          toast(
            'Payment verification failed. If amount was deducted, check your orders in a minute or contact support.',
            'error',
          );
          onFailure?.('Verification failed');
        }
      }
    },
    [checkoutId, verifyPayment, syncPayment, toast, onSuccess, onFailure],
  );

  const handlePay = useCallback(async () => {
    if (payFlowActiveRef.current) return;
    payFlowActiveRef.current = true;

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      payFlowActiveRef.current = false;
      toast('Could not load payment gateway. Check your connection and try again.', 'error');
      onFailure?.('Script load failed');
      return;
    }

    let orderData: FoodRazorpayOrderResult;
    try {
      orderData = await createOrder.mutateAsync(checkoutId);
    } catch {
      payFlowActiveRef.current = false;
      toast('Failed to create payment order. Please try again.', 'error');
      return;
    }

    const standalone = isStandalonePwa();
    if (standalone) {
      sessionStorage.setItem(RAZORPAY_CHECKOUT_SESSION_KEY, checkoutId);
    }

    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.razorpayOrderId,
      name: 'JebDekho',
      description: orderData.orderNumber ? `Order ${orderData.orderNumber}` : `Order from ${storeName}`,
      prefill: {
        name: orderData.buyerName ?? buyerName,
        email: orderData.buyerEmail ?? buyerEmail,
        contact: orderData.buyerPhone ?? buyerPhone,
      },
      theme: { color: '#16a34a' },
      ...(standalone
        ? { redirect: true, callback_url: razorpayCallbackUrl() }
        : {
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                await confirmPayment(response);
              } finally {
                payFlowActiveRef.current = false;
              }
            },
          }),
      modal: {
        ondismiss: () => {
          payFlowActiveRef.current = false;
          if (!standalone) toast('Payment cancelled', 'info');
        },
        ...(standalone ? {} : { confirm_close: true }),
      },
    });

    rzp.open();
  }, [checkoutId, storeName, buyerName, buyerEmail, buyerPhone, createOrder, confirmPayment, toast, onFailure]);

  const busy = createOrder.isPending || verifyPayment.isPending || syncPayment.isPending;
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
