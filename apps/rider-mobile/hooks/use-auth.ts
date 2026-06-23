import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRiderMe,
  logoutSession,
  requestOtp,
  verifyOtp,
} from '@/services/rider-api';
import { clearTokens } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';
import { useRiderStore } from '@/store/rider-store';
import { isKycApproved, isRiderUser } from '@/types/rider';

export const RIDER_ME_KEY = ['rider', 'me'] as const;

export function useRiderSessionQuery() {
  return useQuery({
    queryKey: RIDER_ME_KEY,
    queryFn: fetchRiderMe,
    retry: false,
    staleTime: 60_000,
  });
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: requestOtp });
}

export function useVerifyOtpMutation() {
  const { setSession } = useAuthStore();
  const { setAvailability } = useRiderStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifyOtp(phone, code),
    onSuccess: (data) => {
      if (!isRiderUser(data.user)) return;
      setSession(data.user, data.profile);
      if (data.profile) {
        setAvailability(data.profile.status);
      }
      qc.setQueryData(RIDER_ME_KEY, { user: data.user, profile: data.profile });
    },
  });
}

export function useLogoutMutation() {
  const { clearSession } = useAuthStore();
  const { reset } = useRiderStore();
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
      reset();
      qc.clear();
    },
  });
}

export function useKycGate() {
  const { profile } = useAuthStore();
  return {
    isApproved: isKycApproved(profile),
    kycStatus: profile?.kycStatus ?? 'PENDING',
  };
}
