import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-storage';

const ACCESS_KEY = 'jd_buyer_access_token';
const REFRESH_KEY = 'jd_buyer_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setSecureItem(ACCESS_KEY, accessToken);
  await setSecureItem(REFRESH_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(ACCESS_KEY);
  await deleteSecureItem(REFRESH_KEY);
}

/** Full API base including /api/v1 — talks directly to the NestJS backend. */
export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? 'https://api.jebdekho.com/api/v1';
}
