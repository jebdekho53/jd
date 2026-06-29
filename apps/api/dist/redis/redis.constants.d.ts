export declare const REDIS_CLIENT = "REDIS_CLIENT";
export declare const REDIS_KEYS: {
    readonly otpRateLimit: (phone: string) => string;
    readonly otpAttempts: (otpId: string) => string;
    readonly refreshTokenRevoked: (tokenHash: string) => string;
    readonly userSessions: (userId: string) => string;
    readonly rateLimit: (ip: string, endpoint: string) => string;
    readonly passwordReset: (tokenHash: string) => string;
    readonly adminPasswordReset: (tokenHash: string) => string;
    readonly zoneStores: (zoneId: string) => string;
    readonly riderOnline: (zoneId: string) => string;
};
export declare const REDIS_TTL: {
    readonly OTP_RATE_LIMIT: number;
    readonly REFRESH_TOKEN_REVOKED: number;
    readonly ZONE_STORES: 60;
    readonly SESSION_METADATA: number;
    readonly PASSWORD_RESET: number;
};
