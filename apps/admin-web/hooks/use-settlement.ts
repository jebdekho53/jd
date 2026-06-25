import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approvePayoutRequest,
  fetchAdminPayoutRequests,
  fetchAdminSettlements,
  processPayoutRequest,
  rejectPayoutRequest,
} from '@/services/settlement-api';

export const settlementKeys = {
  all: ['admin-settlement'] as const,
  overview: () => [...settlementKeys.all, 'overview'] as const,
  payouts: (status?: string) => [...settlementKeys.all, 'payouts', status] as const,
};

export function useAdminSettlementsQuery() {
  return useQuery({
    queryKey: settlementKeys.overview(),
    queryFn: fetchAdminSettlements,
    refetchInterval: 30_000,
  });
}

export function useAdminPayoutRequestsQuery(status?: string) {
  return useQuery({
    queryKey: settlementKeys.payouts(status),
    queryFn: () => fetchAdminPayoutRequests({ status }),
    refetchInterval: 15_000,
  });
}

export function useApprovePayoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approvePayoutRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementKeys.all }),
  });
}

export function useRejectPayoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPayoutRequest(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementKeys.all }),
  });
}

export function useProcessPayoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: processPayoutRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementKeys.all }),
  });
}
