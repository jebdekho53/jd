import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPayoutRequest,
  fetchMerchantEarnings,
  fetchMerchantPayouts,
  fetchMerchantSettlements,
} from '@/services/settlement-api';

export const settlementKeys = {
  all: ['settlement'] as const,
  earnings: () => [...settlementKeys.all, 'earnings'] as const,
  settlements: (status?: string) => [...settlementKeys.all, 'settlements', status] as const,
  payouts: () => [...settlementKeys.all, 'payouts'] as const,
};

export function useMerchantEarningsQuery() {
  return useQuery({
    queryKey: settlementKeys.earnings(),
    queryFn: fetchMerchantEarnings,
    refetchInterval: 60_000,
  });
}

export function useMerchantSettlementsQuery(status?: string) {
  return useQuery({
    queryKey: settlementKeys.settlements(status),
    queryFn: () => fetchMerchantSettlements({ status }),
  });
}

export function useMerchantPayoutsQuery() {
  return useQuery({
    queryKey: settlementKeys.payouts(),
    queryFn: () => fetchMerchantPayouts(),
  });
}

export function useCreatePayoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPayoutRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settlementKeys.all });
    },
  });
}
