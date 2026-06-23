'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRazorpayOrder,
  getCheckoutStatus,
  initiateCodCheckout,
  initiateCheckout,
  verifyRazorpayPayment,
} from '@/services/checkout/checkout-api';
import { cartKeys } from '@/hooks/use-cart';
import type { InitiateCheckoutPayload, VerifyPaymentPayload } from '@/types/checkout';

export const checkoutKeys = {
  status: (id: string) => ['checkout', 'status', id] as const,
};

export function useCheckoutStatusQuery(checkoutId: string | null) {
  return useQuery({
    queryKey: checkoutKeys.status(checkoutId ?? ''),
    queryFn: () => getCheckoutStatus(checkoutId!),
    enabled: Boolean(checkoutId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(status)) return false;
      return 5_000;
    },
    staleTime: 0,
  });
}

export function useInitiateCheckoutMutation() {
  return useMutation({
    mutationFn: (payload: InitiateCheckoutPayload) => initiateCheckout(payload),
  });
}

export function useInitiateCodCheckoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InitiateCheckoutPayload) => initiateCodCheckout(payload),
    onSuccess: () => {
      qc.setQueryData(cartKeys.current(), null);
    },
  });
}

export function useCreateRazorpayOrderMutation() {
  return useMutation({
    mutationFn: (checkoutId: string) => createRazorpayOrder(checkoutId),
  });
}

export function useVerifyPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => verifyRazorpayPayment(payload),
    onSuccess: () => {
      qc.setQueryData(cartKeys.current(), null);
    },
  });
}
