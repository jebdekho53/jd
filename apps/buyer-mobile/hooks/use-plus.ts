import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlusMe, getPlusPlans, subscribeToPlus } from '@/services/buyer-api';

export const plusKeys = {
  plans: ['plus', 'plans'] as const,
  me: ['plus', 'me'] as const,
};

export function usePlusPlansQuery() {
  return useQuery({ queryKey: plusKeys.plans, queryFn: getPlusPlans, staleTime: 5 * 60_000 });
}

export function usePlusMeQuery() {
  return useQuery({ queryKey: plusKeys.me, queryFn: getPlusMe });
}

export function useSubscribeToPlusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, yearly }: { planId: string; yearly?: boolean }) =>
      subscribeToPlus(planId, yearly),
    onSuccess: () => qc.invalidateQueries({ queryKey: plusKeys.me }),
  });
}
