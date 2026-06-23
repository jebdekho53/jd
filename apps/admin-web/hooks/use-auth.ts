'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, logoutSession, requestOtp, verifyOtp } from '@/services/admin-api';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
  });
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: requestOtp });
}

export function useVerifyOtpMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifyOtp(phone, code),
    onSuccess: (data) => {
      qc.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      qc.clear();
    },
  });
}
