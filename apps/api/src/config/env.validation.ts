import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  API_PORT: Joi.number().default(3001),
  APP_NAME: Joi.string().default('Jebdekho API'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  TRUST_PROXY: Joi.string().valid('true', 'false').default('false'),
  STORAGE_PROVIDER: Joi.string().valid('local', 's3', 'r2', 'minio').default('local'),
  UPLOAD_DIR: Joi.string().default('/var/www/jebdekho/uploads'),
  UPLOAD_PUBLIC_URL: Joi.string().default('https://api.jebdekho.com/uploads'),
  // Optional CDN base for public uploads. Empty ⇒ preserve current behaviour
  // (serve everything from UPLOAD_PUBLIC_URL). Only set once a CDN hostname is
  // actually reachable — see docs/cloudflare-cdn-setup.md.
  CDN_PUBLIC_URL: Joi.string().uri().empty('').optional().allow(''),
  BUYER_SITE_URL: Joi.string().default('https://jebdekho.com'),
  RAZORPAY_CALLBACK_URL: Joi.string().uri().optional(),

  // JWT — RS256 mandatory (no fallback to HS256)
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_KEY_ID: Joi.string().default('current'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  JWT_ISSUER: Joi.string().default('jebdekho-api'),
  JWT_AUDIENCE: Joi.string().default('jebdekho-clients'),

  // OTP
  OTP_LENGTH: Joi.number().integer().min(4).max(8).default(6),
  OTP_EXPIRES_MINUTES: Joi.number().integer().min(1).max(30).default(5),
  OTP_MAX_ATTEMPTS: Joi.number().integer().min(1).max(10).default(5),
  OTP_RATE_LIMIT_REQUESTS: Joi.number().integer().default(3),
  OTP_RATE_LIMIT_WINDOW_MINUTES: Joi.number().integer().default(10),


  // Authentication feature flags (email-only until MSG91/DLT approval)
  AUTH_EMAIL_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('true'),
  AUTH_PHONE_OTP_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('false'),
  AUTH_SMS_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('false'),
  AUTH_WHATSAPP_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('false'),
  MSG91_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('false'),

  // SMS Provider
  SMS_PROVIDER: Joi.string().valid('msg91', 'console').default('console'),
  MSG91_AUTH_KEY: Joi.string().empty('').when('SMS_PROVIDER', {
    is: 'msg91',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MSG91_SENDER_ID: Joi.string().default('JEBDKH'),
  MSG91_TEMPLATE_ID: Joi.string().empty('').when('SMS_PROVIDER', {
    is: 'msg91',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MSG91_DLT_TE_ID: Joi.string().empty('').optional(),

  // WhatsApp Cloud API (Meta) — OTP channel. All optional; feature is off unless
  // ENABLE_WHATSAPP_OTP=true, at which point the token + phone number id are needed.
  ENABLE_WHATSAPP_OTP: Joi.string().valid('true', 'false', '1', '0').default('false'),
  WHATSAPP_ACCESS_TOKEN: Joi.string().empty('').optional(),
  WHATSAPP_APP_ID: Joi.string().empty('').optional(),
  WHATSAPP_APP_SECRET: Joi.string().empty('').optional(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().empty('').when('ENABLE_WHATSAPP_OTP', {
    is: Joi.valid('true', '1'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().empty('').optional(),
  WHATSAPP_TEST_RECIPIENT_NUMBER: Joi.string().empty('').optional(),
  WHATSAPP_GRAPH_VERSION: Joi.string().default('v21.0'),
  WHATSAPP_OTP_TEMPLATE_NAME: Joi.string().default('otp'),
  WHATSAPP_OTP_TEMPLATE_LANG: Joi.string().default('en_US'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),

  // Razorpay — empty until live keys are configured (COD works without)
  RAZORPAY_KEY_ID: Joi.string().empty('').optional(),
  RAZORPAY_KEY_SECRET: Joi.string().empty('').optional(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string()
    .empty('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('RAZORPAY_KEY_ID', {
        is: Joi.string().min(1),
        then: Joi.required().messages({
          'any.required':
            'RAZORPAY_WEBHOOK_SECRET is required in production when Razorpay is enabled',
        }),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    }),

  // CORS
  CORS_ORIGINS: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
    .default('debug'),

  // Email (SMTP) — required in production
  EMAIL_FROM: Joi.string().default('JebDekho <support@jebdekho.com>'),
  SMTP_HOST: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PORT: Joi.number().default(465),
  SMTP_SECURE: Joi.string().valid('true', 'false').default('true'),
  SMTP_USER: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASS: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASSWORD: Joi.string().empty('').optional(),

  // IMAP (future inbound mail — optional)
  IMAP_HOST: Joi.string().empty('').optional(),
  IMAP_PORT: Joi.number().default(993),

  // Admin bootstrap credentials (fallback when no DB admin exists)
  ADMIN_EMAIL: Joi.string().email().empty('').optional(),
  ADMIN_PASSWORD: Joi.string().empty('').optional(),
  ADMIN_NAME: Joi.string().empty('').default('Platform Admin'),
  ADMIN_URL: Joi.string().uri().empty('').default('https://admin.jebdekho.com'),

  // Logistics providers
  DELIVERY_PROVIDER: Joi.string()
    .valid('shadowfax', 'porter', 'delhivery', 'borzo', 'own_fleet')
    .default('shadowfax'),
  ENABLE_OWN_FLEET: Joi.string().valid('true', 'false').default('false'),
  ENABLE_SHADOWFAX: Joi.string().valid('true', 'false').default('true'),
  ENABLE_PORTER: Joi.string().valid('true', 'false').default('false'),
  ENABLE_DELHIVERY: Joi.string().valid('true', 'false').default('false'),
  ENABLE_BORZO: Joi.string().valid('true', 'false').default('false'),
  SHADOWFAX_API_URL: Joi.string().uri().empty('').optional(),
  SHADOWFAX_API_MODE: Joi.string()
    .valid('dale_staging', 'dale_production', 'staging', 'production', 'prod', 'hl_staging', 'legacy', 'hl_marketplace', 'v2', 'v3_marketplace', 'v3_warehouse', 'v3', 'flash', 'hyperlocal', 'hl', 'warehouse', 'marketplace', 'ecommerce', '')
    .empty('')
    .optional(),
  SHADOWFAX_CREDITS_KEY: Joi.string().empty('').optional(),
  SHADOWFAX_CLIENT_ID: Joi.string().empty('').optional(),
  SHADOWFAX_CLIENT_SECRET: Joi.string().empty('').optional(),
  SHADOWFAX_TEST_TOKEN: Joi.string().empty('').optional(),
  SHADOWFAX_PRODUCTION_TOKEN: Joi.string().empty('').optional(),
  SHADOWFAX_WEBHOOK_SECRET: Joi.string().empty('').optional(),
  SHADOWFAX_PREALLOCATED_AWBS: Joi.string().empty('').optional(),
  SHADOWFAX_PREALLOCATED_REVERSE_AWBS: Joi.string().empty('').optional(),

  WEB_PUSH_PUBLIC_KEY: Joi.string().empty('').optional(),
  WEB_PUSH_PRIVATE_KEY: Joi.string().empty('').optional(),
  WEB_PUSH_SUBJECT: Joi.string().default('mailto:support@jebdekho.com'),

  AI_PRODUCT_ANALYSIS_PRICE_PAISE: Joi.number().integer().min(1).default(150),
  AI_PRODUCT_ANALYSIS_DAILY_LIMIT: Joi.number().integer().min(1).default(20),
  AI_WALLET_MIN_RECHARGE_PAISE: Joi.number().integer().min(100).default(10000),
  OPENAI_API_KEY: Joi.string().empty('').optional(),
  OPENAI_VISION_MODEL: Joi.string().default('gpt-4o-mini'),
  PRODUCT_CSV_PLACEHOLDER_IMAGE_URL: Joi.string().uri().empty('').optional(),
});
