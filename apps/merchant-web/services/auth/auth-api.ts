import { merchantFetch, ApiError } from '@/services/api/merchant-client';
import type { ApiResponse, AuthUser, RequestOtpResult, VerifyOtpResult } from '@/types/auth';

export type RequestOtpInput =
  | { phone: string; email?: never }
  | { email: string; phone?: never };

export async function requestOtp(input: RequestOtpInput): Promise<RequestOtpResult> {
  const res = await merchantFetch<ApiResponse<RequestOtpResult>>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ ...input, deviceName: 'merchant-web' }),
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

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await merchantFetch<ApiResponse<AuthUser>>('/api/auth/me');
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function logoutSession(): Promise<void> {
  await merchantFetch<ApiResponse<unknown>>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
