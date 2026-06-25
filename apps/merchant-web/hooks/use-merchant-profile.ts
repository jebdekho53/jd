import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMerchantProfile,
  createMerchantProfile,
  updateMerchantProfile,
  type UpsertMerchantProfilePayload,
} from '@/services/merchant/merchant-api';
import { ApiError } from '@/services/api/merchant-client';

export function useMerchantProfileQuery() {
  return useQuery({
    queryKey: ['merchant', 'profile'],
    queryFn: getMerchantProfile,
    retry: false,
    staleTime: 60_000,
  });
}

export function useUpsertMerchantProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertMerchantProfilePayload) => {
      try {
        return await updateMerchantProfile(payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return createMerchantProfile(payload);
        }
        throw err;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'profile'] }),
  });
}
