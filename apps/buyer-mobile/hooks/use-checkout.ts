import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptLegal,
  checkoutCod,
  createRazorpayOrder,
  getPendingLegal,
  initiateCheckout,
  syncRazorpayPayment,
  verifyRazorpayPayment,
} from '@/services/buyer-api';
import { cartKeys } from '@/hooks/use-cart';
import type { CheckoutPayload, InitiateCheckoutPayload, VerifyPaymentPayload } from '@/types/checkout';

export function usePendingLegalQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['legal', 'pending', 'buyer'],
    queryFn: () => getPendingLegal('buyer'),
    enabled,
    staleTime: 60_000,
  });
}

export function useAcceptLegalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, version }: { code: string; version: string }) => acceptLegal(code, version),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal', 'pending', 'buyer'] }),
  });
}

export function useCheckoutCodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: CheckoutPayload; idempotencyKey?: string }) =>
      checkoutCod(payload, idempotencyKey),
    onSuccess: () => {
      // Cart is deleted server-side once the order is created.
      qc.setQueryData(cartKeys.current, null);
    },
  });
}

/** Reserves inventory + creates a pending order for online payment. Cart
 *  is cleared server-side once reservation succeeds, same as COD. */
export function useInitiateCheckoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: InitiateCheckoutPayload;
      idempotencyKey?: string;
    }) => initiateCheckout(payload, idempotencyKey),
    onSuccess: () => {
      qc.setQueryData(cartKeys.current, null);
    },
  });
}

export function useCreateRazorpayOrderMutation() {
  return useMutation({
    mutationFn: ({ checkoutId, idempotencyKey }: { checkoutId: string; idempotencyKey?: string }) =>
      createRazorpayOrder(checkoutId, idempotencyKey),
  });
}

export function useVerifyRazorpayPaymentMutation() {
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: VerifyPaymentPayload;
      idempotencyKey?: string;
    }) => verifyRazorpayPayment(payload, idempotencyKey),
  });
}

export function useSyncRazorpayPaymentMutation() {
  return useMutation({
    mutationFn: ({ checkoutId, idempotencyKey }: { checkoutId: string; idempotencyKey?: string }) =>
      syncRazorpayPayment(checkoutId, idempotencyKey),
  });
}
