export const REDIS_CLIENT = 'REDIS_CLIENT';

// Key prefix patterns
export const REDIS_KEYS = {
  otpRateLimit: (phone: string) => `otp:rate:${phone}`,
  otpAttempts: (otpId: string) => `otp:attempts:${otpId}`,
  refreshTokenRevoked: (tokenHash: string) => `rt:revoked:${tokenHash}`,
  userSessions: (userId: string) => `sessions:${userId}`,
  rateLimit: (ip: string, endpoint: string) => `rate:${ip}:${endpoint}`,
  passwordReset: (tokenHash: string) => `pwdreset:${tokenHash}`,
  zoneStores: (zoneId: string) => `zone:stores:${zoneId}`,
  riderOnline: (zoneId: string) => `rider:online:${zoneId}`,
} as const;

// TTLs in seconds
export const REDIS_TTL = {
  OTP_RATE_LIMIT: 60 * 10,       // 10 minutes
  REFRESH_TOKEN_REVOKED: 60 * 60 * 24 * 31, // 31 days
  ZONE_STORES: 60,               // 1 minute
  SESSION_METADATA: 60 * 60 * 24 * 7,  // 7 days
  PASSWORD_RESET: 15 * 60,          // 15 minutes
} as const;
