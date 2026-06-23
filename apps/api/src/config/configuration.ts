import { ConfigService } from '@nestjs/config';

/**
 * Typed helper — use instead of raw configService.get<T>('KEY') to centralise
 * key names and default values throughout the application.
 */
export function getConfig(configService: ConfigService) {
  // RSA PEM keys may be stored with literal \n in env vars; normalise here.
  const normalisePem = (raw: string) => raw.replace(/\\n/g, '\n');

  return {
    nodeEnv: configService.get<string>('NODE_ENV', 'development'),
    port: configService.get<number>('API_PORT', 3001),

    jwt: {
      privateKey: normalisePem(configService.get<string>('JWT_PRIVATE_KEY', '')),
      publicKey: normalisePem(configService.get<string>('JWT_PUBLIC_KEY', '')),
      keyId: configService.get<string>('JWT_KEY_ID', 'current'),
      accessExpiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      refreshExpiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      issuer: configService.get<string>('JWT_ISSUER', 'jebdekho-api'),
      audience: configService.get<string>('JWT_AUDIENCE', 'jebdekho-clients'),
    },

    otp: {
      length: configService.get<number>('OTP_LENGTH', 6),
      expiresMinutes: configService.get<number>('OTP_EXPIRES_MINUTES', 5),
      maxAttempts: configService.get<number>('OTP_MAX_ATTEMPTS', 5),
      rateLimitRequests: configService.get<number>('OTP_RATE_LIMIT_REQUESTS', 3),
      rateLimitWindowMinutes: configService.get<number>('OTP_RATE_LIMIT_WINDOW_MINUTES', 10),
    },

    sms: {
      provider: configService.get<string>('SMS_PROVIDER', 'console'),
      msg91: {
        authKey: configService.get<string>('MSG91_AUTH_KEY', ''),
        senderId: configService.get<string>('MSG91_SENDER_ID', 'JEBDKH'),
        templateId: configService.get<string>('MSG91_TEMPLATE_ID', ''),
        dltTeId: configService.get<string>('MSG91_DLT_TE_ID', ''),
      },
    },

    cors: {
      origins: configService
        .get<string>('CORS_ORIGINS', 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim()),
    },

    logging: {
      level: configService.get<string>('LOG_LEVEL', 'debug'),
    },

    throttle: {
      ttl: configService.get<number>('THROTTLE_TTL', 60000),
      limit: configService.get<number>('THROTTLE_LIMIT', 100),
      authLimit: configService.get<number>('AUTH_THROTTLE_LIMIT', 10),
    },

    razorpay: {
      keyId: configService.get<string>('RAZORPAY_KEY_ID', ''),
      keySecret: configService.get<string>('RAZORPAY_KEY_SECRET', ''),
      webhookSecret: configService.get<string>('RAZORPAY_WEBHOOK_SECRET', ''),
    },
  } as const;
}

export type AppConfig = ReturnType<typeof getConfig>;
