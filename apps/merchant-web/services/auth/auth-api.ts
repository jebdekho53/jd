import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse, AuthUser, RequestOtpResult, VerifyOtpResult } from '@/types/auth';

export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const res = await merchantFetch<ApiResponse<RequestOtpResult>>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, deviceName: 'merchant-web' }),
  });
  return res.data;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const res = await merchantFetch<ApiResponse<VerifyOtpResult>>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, deviceName: 'merchant-web' }),
  });
  return res.data;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await merchantFetch<ApiResponse<AuthUser>>('/api/auth/me');
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await merchantFetch<ApiResponse<unknown>>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
