import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acceptLegal, checkoutCod, getPendingLegal } from '@/services/buyer-api';
import { cartKeys } from '@/hooks/use-cart';
import type { CheckoutPayload } from '@/types/checkout';

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
