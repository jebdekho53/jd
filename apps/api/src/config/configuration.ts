import { ConfigService } from '@nestjs/config';
import { envBool } from './env-bool.util';

/**
 * Typed helper — use instead of raw configService.get<T>('KEY') to centralise
 * key names and default values throughout the application.
 */
export function getConfig(configService: ConfigService) {
  // RSA PEM keys may be stored with literal \n in env vars; normalise here.
  const normalisePem = (raw: string) => raw.replace(/\\n/g, '\n');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const productionCors =
    'https://jebdekho.com,https://www.jebdekho.com,https://admin.jebdekho.com,https://merchant.jebdekho.com,https://rider.jebdekho.com,https://vendor.jebdekho.com,https://franchise.jebdekho.com';

  return {
    nodeEnv,
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

    dev: {
      demoPhone: configService.get<string>('DEV_DEMO_PHONE', '+919876543210'),
      demoMerchantPhone: configService.get<string>(
        'DEV_DEMO_MERCHANT_PHONE',
        '+919876543211',
      ),
      demoMerchantEmail: configService.get<string>(
        'DEV_DEMO_MERCHANT_EMAIL',
        'merchant@demo.jebdekho.com',
      ),
      demoMerchantPhone2: configService.get<string>(
        'DEV_DEMO_MERCHANT_PHONE_2',
        '+919876543213',
      ),
      demoMerchantEmail2: configService.get<string>(
        'DEV_DEMO_MERCHANT_EMAIL_2',
        'merchant2@demo.jebdekho.com',
      ),
      demoAdminPhone: configService.get<string>(
        'DEV_DEMO_ADMIN_PHONE',
        '+919876543212',
      ),
      demoAdminEmail: configService.get<string>(
        'DEV_DEMO_ADMIN_EMAIL',
        'admin@demo.jebdekho.com',
      ),
      demoRiderPhone: configService.get<string>(
        'DEV_DEMO_RIDER_PHONE',
        '+919876543214',
      ),
      demoOtp: configService.get<string>('DEV_DEMO_OTP', '123456'),
    },

    auth: {
      emailEnabled: envBool(configService, 'AUTH_EMAIL_ENABLED', true),
      phoneOtpEnabled: envBool(configService, 'AUTH_PHONE_OTP_ENABLED', false),
      smsEnabled: envBool(configService, 'AUTH_SMS_ENABLED', false),
      whatsappEnabled: envBool(configService, 'AUTH_WHATSAPP_ENABLED', false),
      msg91Enabled: envBool(configService, 'MSG91_ENABLED', false),
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
        .get<string>(
          'CORS_ORIGINS',
          nodeEnv === 'production' ? productionCors : '',
        )
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    },

    storage: {
      provider: configService.get<string>('STORAGE_PROVIDER', 'local'),
      uploadDir: configService.get<string>('UPLOAD_DIR', '/var/www/jebdekho/uploads'),
      uploadPublicUrl: configService.get<string>(
        'UPLOAD_PUBLIC_URL',
        'https://api.jebdekho.com/uploads',
      ),
    },

    trustProxy: configService.get<string>('TRUST_PROXY', 'false') === 'true',

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

    logistics: {
      deliveryProvider: configService.get<string>('DELIVERY_PROVIDER', 'shadowfax'),
      enableOwnFleet: configService.get<string>('ENABLE_OWN_FLEET', 'false') === 'true',
      enableShadowfax: configService.get<string>('ENABLE_SHADOWFAX', 'true') === 'true',
      enablePorter: configService.get<string>('ENABLE_PORTER', 'false') === 'true',
      enableDelhivery: configService.get<string>('ENABLE_DELHIVERY', 'false') === 'true',
      enableBorzo: configService.get<string>('ENABLE_BORZO', 'false') === 'true',
      shadowfax: {
        apiUrl: configService.get<string>('SHADOWFAX_API_URL', ''),
        apiMode: configService.get<string>('SHADOWFAX_API_MODE', ''),
        creditsKey: configService.get<string>('SHADOWFAX_CREDITS_KEY', ''),
        clientId: configService.get<string>('SHADOWFAX_CLIENT_ID', ''),
        clientSecret: configService.get<string>('SHADOWFAX_CLIENT_SECRET', ''),
        testToken: configService.get<string>('SHADOWFAX_TEST_TOKEN', ''),
        productionToken: configService.get<string>('SHADOWFAX_PRODUCTION_TOKEN', ''),
        webhookSecret: configService.get<string>('SHADOWFAX_WEBHOOK_SECRET', ''),
        preallocatedAwbs: configService.get<string>('SHADOWFAX_PREALLOCATED_AWBS', ''),
        preallocatedReverseAwbs: configService.get<string>('SHADOWFAX_PREALLOCATED_REVERSE_AWBS', ''),
      },
    },

    buyerSiteUrl: configService.get<string>('BUYER_SITE_URL', 'https://jebdekho.com'),

    webPush: {
      publicKey: configService.get<string>('WEB_PUSH_PUBLIC_KEY', ''),
      privateKey: configService.get<string>('WEB_PUSH_PRIVATE_KEY', ''),
      subject: configService.get<string>('WEB_PUSH_SUBJECT', 'mailto:support@jebdekho.com'),
    },

    smtp: (() => {
      const host = configService.get<string>('SMTP_HOST', '');
      const user = configService.get<string>('SMTP_USER', '');
      const pass =
        configService.get<string>('SMTP_PASS', '') ||
        configService.get<string>('SMTP_PASSWORD', '');
      const enabled = Boolean(host && user && pass);
      return {
        enabled,
        host,
        port: configService.get<number>('SMTP_PORT', 465),
        secure: configService.get<string>('SMTP_SECURE', 'true') === 'true',
        user,
        pass,
        from: configService.get<string>(
          'EMAIL_FROM',
          'JebDekho <support@jebdekho.com>',
        ),
      };
    })(),
  } as const;
}

export type AppConfig = ReturnType<typeof getConfig>;
