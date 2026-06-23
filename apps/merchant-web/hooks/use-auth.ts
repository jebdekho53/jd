'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, requestOtp, verifyOtp, logoutSession } from '@/services/auth/auth-api';
import { useAuthStore } from '@/store/auth-store';

export function useSessionQuery() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: (phone: string) => requestOtp(phone),
  });
}

export function useVerifyOtpMutation() {
  const { setSession } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifyOtp(phone, code),
    onSuccess: (data) => {
      setSession(data.user);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useLogoutMutation() {
  const { clearSession } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      clearSession();
      qc.clear();
    },
  });
}
