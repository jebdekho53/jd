"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_TTL = exports.REDIS_KEYS = exports.REDIS_CLIENT = void 0;
exports.REDIS_CLIENT = 'REDIS_CLIENT';
exports.REDIS_KEYS = {
    otpRateLimit: (phone) => `otp:rate:${phone}`,
    otpAttempts: (otpId) => `otp:attempts:${otpId}`,
    refreshTokenRevoked: (tokenHash) => `rt:revoked:${tokenHash}`,
    userSessions: (userId) => `sessions:${userId}`,
    rateLimit: (ip, endpoint) => `rate:${ip}:${endpoint}`,
    passwordReset: (tokenHash) => `pwdreset:${tokenHash}`,
    adminPasswordReset: (tokenHash) => `admin:pwdreset:${tokenHash}`,
    zoneStores: (zoneId) => `zone:stores:${zoneId}`,
    riderOnline: (zoneId) => `rider:online:${zoneId}`,
};
exports.REDIS_TTL = {
    OTP_RATE_LIMIT: 60 * 10,
    REFRESH_TOKEN_REVOKED: 60 * 60 * 24 * 31,
    ZONE_STORES: 60,
    SESSION_METADATA: 60 * 60 * 24 * 7,
    PASSWORD_RESET: 15 * 60,
};
//# sourceMappingURL=redis.constants.js.map