import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, logoutSession, requestOtp, stepUp, verifyOtp } from '@/services/buyer-api';
import { clearTokens } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
    enabled,
  });
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: requestOtp });
}

export function useVerifyOtpMutation() {
  const { setSession } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifyOtp(phone, code),
    onSuccess: (data) => {
      setSession(data.user);
      qc.setQueryData(AUTH_ME_KEY, data.user);
    },
  });
}

/** Step-up re-auth for sensitive actions (checkout) when the session's login
 *  is more than 15 minutes old. Does not change the signed-in user, just
 *  refreshes authTime on the access token. */
export function useStepUpMutation() {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => stepUp(phone, code),
  });
}

export function useLogoutMutation() {
  const { clearSession } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await logoutSession();
      } finally {
        await clearTokens();
      }
    },
    onSettled: () => {
      clearSession();
      qc.clear();
    },
  });
}
