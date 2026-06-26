'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, requestOtp, verifyOtp, logoutSession } from '@/services/auth/auth-api';
import { ApiError } from '@/services/api/merchant-client';
import type { RequestOtpInput } from '@/services/auth/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { useStoreStore } from '@/store/store-store';

export function useSessionQuery(enabled = true) {
  const { setSession, clearSession } = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    enabled,
    queryFn: async () => {
      try {
        const user = await fetchMe();
        if (user) setSession(user);
        else clearSession();
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) throw err;
        return useAuthStore.getState().user;
      }
    },
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 0) {
        return failureCount < 2;
      }
      return false;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: (input: RequestOtpInput) => requestOtp(input),
  });
}

export function useVerifyOtpMutation() {
  const { setSession } = useAuthStore();
  const { clearCurrentStore } = useStoreStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifyOtp(phone, code),
    onSuccess: (data) => {
      clearCurrentStore();
      qc.clear();
      setSession(data.user);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useLogoutMutation() {
  const { clearSession } = useAuthStore();
  const { clearCurrentStore } = useStoreStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      clearSession();
      clearCurrentStore();
      qc.clear();
    },
  });
}
