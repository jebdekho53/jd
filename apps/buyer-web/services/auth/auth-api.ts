import type {
  ApiResponse,
  AuthUser,
  RequestOtpResult,
  VerifyOtpResult,
} from '@/types/auth';

export class SessionError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

async function sessionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new SessionError('No internet connection. Check your network and try again.', 0, 'OFFLINE');
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { message?: string | string[] })?.message ??
      'Something went wrong';
    const text = Array.isArray(message) ? message.join(', ') : String(message);
    throw new SessionError(text, res.status);
  }

  return body as T;
}

export async function requestOtp(phone: string, deviceId?: string): Promise<RequestOtpResult> {
  const res = await sessionFetch<ApiResponse<RequestOtpResult>>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, deviceId, deviceName: 'buyer-web' }),
  });
  return res.data;
}

export async function verifyOtp(
  phone: string,
  code: string,
  deviceId?: string,
): Promise<VerifyOtpResult> {
  const res = await sessionFetch<ApiResponse<VerifyOtpResult>>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, deviceId, deviceName: 'buyer-web' }),
  });
  return res.data;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await sessionFetch<ApiResponse<AuthUser>>('/api/auth/me');
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await sessionFetch<ApiResponse<{ message: string }>>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function refreshSession(): Promise<void> {
  await sessionFetch<ApiResponse<{ expiresIn: number }>>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
