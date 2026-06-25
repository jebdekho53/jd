'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, requestOtp, verifyOtp, logoutSession } from '@/services/auth/auth-api';
import type { RequestOtpInput } from '@/services/auth/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { useStoreStore } from '@/store/store-store';

export function useSessionQuery() {
  const { setSession, clearSession } = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await fetchMe();
      if (user) setSession(user);
      else clearSession();
      return user;
    },
    retry: false,
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
