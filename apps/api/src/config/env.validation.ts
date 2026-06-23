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
  REDIS_URL: Joi.string().default('redis://localhost:6379'),

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

  // SMS Provider
  SMS_PROVIDER: Joi.string().valid('msg91', 'console').default('console'),
  MSG91_AUTH_KEY: Joi.string().when('SMS_PROVIDER', {
    is: 'msg91',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MSG91_SENDER_ID: Joi.string().default('JEBDKH'),
  MSG91_TEMPLATE_ID: Joi.string().when('SMS_PROVIDER', {
    is: 'msg91',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MSG91_DLT_TE_ID: Joi.string().optional(),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),

  // Razorpay
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().optional(),

  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
    .default('debug'),
});
