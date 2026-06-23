export const ACCESS_COOKIE = 'jd_access_token';
export const REFRESH_COOKIE = 'jd_refresh_token';

const isProd = process.env.NODE_ENV === 'production';

export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
};

export function accessCookieMaxAge(expiresInSeconds: number): number {
  return Math.max(60, expiresInSeconds - 30);
}

/** Refresh token — 30 days */
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;
