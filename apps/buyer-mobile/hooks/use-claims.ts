import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrderClaim, getOrderClaimEligibility } from '@/services/buyer-api';
import type { CreateOrderClaimInput } from '@/types/claims';
import { orderKeys } from '@/hooks/use-orders';

export const claimKeys = {
  eligibility: (orderId: string) => ['claims', 'eligibility', orderId] as const,
};

export function useOrderClaimEligibilityQuery(orderId: string) {
  return useQuery({
    queryKey: claimKeys.eligibility(orderId),
    queryFn: () => getOrderClaimEligibility(orderId),
    enabled: !!orderId,
  });
}

export function useCreateOrderClaimMutation(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderClaimInput) => createOrderClaim(orderId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claimKeys.eligibility(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
  });
}
