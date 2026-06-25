'use client';

import { useMutation } from '@tanstack/react-query';
import {
  emailLogin,
  emailSignup,
  fetchMe,
  forgotPassword,
  logoutSession,
  requestOtp,
  resetPassword,
  verifyOtp,
  SessionError,
} from '@/services/auth/auth-api';
import { getDeviceId } from '@/lib/device-id';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: (input: { phone: string }) => requestOtp(input.phone, getDeviceId()),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (input: {
      phone: string;
      code: string;
      name?: string;
      referralCode?: string;
    }) =>
      verifyOtp(input.phone, input.code, getDeviceId(), {
        name: input.name,
        referralCode: input.referralCode,
      }),
  });
}

export function useEmailLoginMutation() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      emailLogin(input.email, input.password, getDeviceId()),
  });
}

export function useEmailSignupMutation() {
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
      referralCode?: string;
    }) => emailSignup({ ...input, deviceId: getDeviceId() }),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: { email?: string; phone?: string }) => forgotPassword(input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: {
      token?: string;
      phone?: string;
      code?: string;
      newPassword: string;
    }) => resetPassword(input),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logoutSession,
  });
}

export { fetchMe, SessionError };
