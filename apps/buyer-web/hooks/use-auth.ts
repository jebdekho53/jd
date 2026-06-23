'use client';

import { useMutation } from '@tanstack/react-query';
import { fetchMe, logoutSession, requestOtp, verifyOtp, SessionError } from '@/services/auth/auth-api';
import { getDeviceId } from '@/lib/device-id';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: (phone: string) => requestOtp(phone, getDeviceId()),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      verifyOtp(phone, code, getDeviceId()),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logoutSession,
  });
}

export { fetchMe, SessionError };
