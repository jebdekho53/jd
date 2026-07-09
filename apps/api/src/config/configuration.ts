import { ConfigService } from '@nestjs/config';
import { envBool } from './env-bool.util';
import { envInt } from './env-int.util';

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
    port: envInt(configService, 'API_PORT', 3001),

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
      length: envInt(configService, 'OTP_LENGTH', 6),
      expiresMinutes: envInt(configService, 'OTP_EXPIRES_MINUTES', 5),
      maxAttempts: envInt(configService, 'OTP_MAX_ATTEMPTS', 5),
      rateLimitRequests: envInt(configService, 'OTP_RATE_LIMIT_REQUESTS', 3),
      rateLimitWindowMinutes: envInt(configService, 'OTP_RATE_LIMIT_WINDOW_MINUTES', 10),
    },


    auth: (() => {
      // Phone OTP + all mobile messaging now runs on the Meta WhatsApp Cloud API
      // (MSG91/SMS retired). It auto-enables when ENABLE_WHATSAPP_OTP is on AND
      // the WhatsApp access token + phone-number id are present — set those in
      // env.production and the whole mobile-OTP / order-update path lights up.
      const waEnabled = envBool(configService, 'ENABLE_WHATSAPP_OTP', false);
      const waToken = (configService.get<string>('WHATSAPP_ACCESS_TOKEN', '') ?? '').trim();
      const waPhoneId = (configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', '') ?? '').trim();
      const whatsappConfigured = waEnabled && Boolean(waToken && waPhoneId);
      return {
        emailEnabled: envBool(configService, 'AUTH_EMAIL_ENABLED', true),
        phoneOtpEnabled: whatsappConfigured,
        // SMS/MSG91 fully retired.
        smsEnabled: false,
        whatsappEnabled: whatsappConfigured,
        msg91Enabled: false,
      };
    })(),

    sms: {
      provider: configService.get<string>('SMS_PROVIDER', 'console'),
      msg91: {
        authKey: configService.get<string>('MSG91_AUTH_KEY', ''),
        senderId: configService.get<string>('MSG91_SENDER_ID', 'JEBDKH'),
        templateId: configService.get<string>('MSG91_TEMPLATE_ID', ''),
        dltTeId: configService.get<string>('MSG91_DLT_TE_ID', ''),
      },
    },

    delivery: {
      // Flat platform delivery fee (₹, GST-inclusive) charged to the customer in
      // PLATFORM mode below the merchant's free-delivery threshold. Default ₹49
      // covers Shadowfax Zone A (intracity) ₹39 + 18% GST ≈ ₹46 plus a buffer.
      platformFeeRupees: Number(configService.get<string | number>('PLATFORM_DELIVERY_FEE_PAISE', 4900)) / 100,
    },

    // WhatsApp Cloud API (Meta) — OTP delivery channel. Gated by ENABLE_WHATSAPP_OTP
    // (default OFF so production OTP keeps flowing through MSG91/SMS). While on a Meta
    // TEST token, WHATSAPP_TEST_RECIPIENT_NUMBER restricts sends to that one verified
    // number; every other recipient falls back to the SMS path automatically.
    // Access token is read fresh at send-time (not memoised) so a token rotation only
    // needs an env update + process reload — no code change.
    whatsapp: {
      otpEnabled: envBool(configService, 'ENABLE_WHATSAPP_OTP', false),
      phoneNumberId: configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', ''),
      businessAccountId: configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID', ''),
      appId: configService.get<string>('WHATSAPP_APP_ID', ''),
      testRecipient: configService.get<string>('WHATSAPP_TEST_RECIPIENT_NUMBER', ''),
      graphVersion: configService.get<string>('WHATSAPP_GRAPH_VERSION', 'v21.0'),
      otpTemplateName: configService.get<string>('WHATSAPP_OTP_TEMPLATE_NAME', 'otp'),
      otpTemplateLang: configService.get<string>('WHATSAPP_OTP_TEMPLATE_LANG', 'en_US'),
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
      ttl: envInt(configService, 'THROTTLE_TTL', 60000),
      limit: envInt(configService, 'THROTTLE_LIMIT', 100),
      authLimit: envInt(configService, 'AUTH_THROTTLE_LIMIT', 10),
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
        port: envInt(configService, 'SMTP_PORT', 465),
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
