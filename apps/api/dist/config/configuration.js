"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const env_bool_util_1 = require("./env-bool.util");
function getConfig(configService) {
    const normalisePem = (raw) => raw.replace(/\\n/g, '\n');
    const nodeEnv = configService.get('NODE_ENV', 'development');
    const productionCors = 'https://jebdekho.com,https://www.jebdekho.com,https://admin.jebdekho.com,https://merchant.jebdekho.com,https://rider.jebdekho.com,https://vendor.jebdekho.com,https://franchise.jebdekho.com';
    return {
        nodeEnv,
        port: configService.get('API_PORT', 3001),
        jwt: {
            privateKey: normalisePem(configService.get('JWT_PRIVATE_KEY', '')),
            publicKey: normalisePem(configService.get('JWT_PUBLIC_KEY', '')),
            keyId: configService.get('JWT_KEY_ID', 'current'),
            accessExpiresIn: configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
            refreshExpiresIn: configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
            issuer: configService.get('JWT_ISSUER', 'jebdekho-api'),
            audience: configService.get('JWT_AUDIENCE', 'jebdekho-clients'),
        },
        otp: {
            length: configService.get('OTP_LENGTH', 6),
            expiresMinutes: configService.get('OTP_EXPIRES_MINUTES', 5),
            maxAttempts: configService.get('OTP_MAX_ATTEMPTS', 5),
            rateLimitRequests: configService.get('OTP_RATE_LIMIT_REQUESTS', 3),
            rateLimitWindowMinutes: configService.get('OTP_RATE_LIMIT_WINDOW_MINUTES', 10),
        },
        dev: {
            demoPhone: configService.get('DEV_DEMO_PHONE', '+919876543210'),
            demoMerchantPhone: configService.get('DEV_DEMO_MERCHANT_PHONE', '+919876543211'),
            demoMerchantEmail: configService.get('DEV_DEMO_MERCHANT_EMAIL', 'merchant@demo.jebdekho.com'),
            demoMerchantPhone2: configService.get('DEV_DEMO_MERCHANT_PHONE_2', '+919876543213'),
            demoMerchantEmail2: configService.get('DEV_DEMO_MERCHANT_EMAIL_2', 'merchant2@demo.jebdekho.com'),
            demoAdminPhone: configService.get('DEV_DEMO_ADMIN_PHONE', '+919876543212'),
            demoAdminEmail: configService.get('DEV_DEMO_ADMIN_EMAIL', 'admin@demo.jebdekho.com'),
            demoRiderPhone: configService.get('DEV_DEMO_RIDER_PHONE', '+919876543214'),
            demoOtp: configService.get('DEV_DEMO_OTP', '123456'),
        },
        auth: {
            emailEnabled: (0, env_bool_util_1.envBool)(configService, 'AUTH_EMAIL_ENABLED', true),
            phoneOtpEnabled: (0, env_bool_util_1.envBool)(configService, 'AUTH_PHONE_OTP_ENABLED', false),
            smsEnabled: (0, env_bool_util_1.envBool)(configService, 'AUTH_SMS_ENABLED', false),
            whatsappEnabled: (0, env_bool_util_1.envBool)(configService, 'AUTH_WHATSAPP_ENABLED', false),
            msg91Enabled: (0, env_bool_util_1.envBool)(configService, 'MSG91_ENABLED', false),
        },
        sms: {
            provider: configService.get('SMS_PROVIDER', 'console'),
            msg91: {
                authKey: configService.get('MSG91_AUTH_KEY', ''),
                senderId: configService.get('MSG91_SENDER_ID', 'JEBDKH'),
                templateId: configService.get('MSG91_TEMPLATE_ID', ''),
                dltTeId: configService.get('MSG91_DLT_TE_ID', ''),
            },
        },
        whatsapp: {
            otpEnabled: (0, env_bool_util_1.envBool)(configService, 'ENABLE_WHATSAPP_OTP', false),
            phoneNumberId: configService.get('WHATSAPP_PHONE_NUMBER_ID', ''),
            businessAccountId: configService.get('WHATSAPP_BUSINESS_ACCOUNT_ID', ''),
            appId: configService.get('WHATSAPP_APP_ID', ''),
            testRecipient: configService.get('WHATSAPP_TEST_RECIPIENT_NUMBER', ''),
            graphVersion: configService.get('WHATSAPP_GRAPH_VERSION', 'v21.0'),
            otpTemplateName: configService.get('WHATSAPP_OTP_TEMPLATE_NAME', 'otp'),
            otpTemplateLang: configService.get('WHATSAPP_OTP_TEMPLATE_LANG', 'en_US'),
        },
        cors: {
            origins: configService
                .get('CORS_ORIGINS', nodeEnv === 'production' ? productionCors : '')
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean),
        },
        storage: {
            provider: configService.get('STORAGE_PROVIDER', 'local'),
            uploadDir: configService.get('UPLOAD_DIR', '/var/www/jebdekho/uploads'),
            uploadPublicUrl: configService.get('UPLOAD_PUBLIC_URL', 'https://api.jebdekho.com/uploads'),
        },
        trustProxy: configService.get('TRUST_PROXY', 'false') === 'true',
        logging: {
            level: configService.get('LOG_LEVEL', 'debug'),
        },
        throttle: {
            ttl: configService.get('THROTTLE_TTL', 60000),
            limit: configService.get('THROTTLE_LIMIT', 100),
            authLimit: configService.get('AUTH_THROTTLE_LIMIT', 10),
        },
        razorpay: {
            keyId: configService.get('RAZORPAY_KEY_ID', ''),
            keySecret: configService.get('RAZORPAY_KEY_SECRET', ''),
            webhookSecret: configService.get('RAZORPAY_WEBHOOK_SECRET', ''),
        },
        logistics: {
            deliveryProvider: configService.get('DELIVERY_PROVIDER', 'shadowfax'),
            enableOwnFleet: configService.get('ENABLE_OWN_FLEET', 'false') === 'true',
            enableShadowfax: configService.get('ENABLE_SHADOWFAX', 'true') === 'true',
            enablePorter: configService.get('ENABLE_PORTER', 'false') === 'true',
            enableDelhivery: configService.get('ENABLE_DELHIVERY', 'false') === 'true',
            enableBorzo: configService.get('ENABLE_BORZO', 'false') === 'true',
            shadowfax: {
                apiUrl: configService.get('SHADOWFAX_API_URL', ''),
                apiMode: configService.get('SHADOWFAX_API_MODE', ''),
                creditsKey: configService.get('SHADOWFAX_CREDITS_KEY', ''),
                clientId: configService.get('SHADOWFAX_CLIENT_ID', ''),
                clientSecret: configService.get('SHADOWFAX_CLIENT_SECRET', ''),
                testToken: configService.get('SHADOWFAX_TEST_TOKEN', ''),
                productionToken: configService.get('SHADOWFAX_PRODUCTION_TOKEN', ''),
                webhookSecret: configService.get('SHADOWFAX_WEBHOOK_SECRET', ''),
                preallocatedAwbs: configService.get('SHADOWFAX_PREALLOCATED_AWBS', ''),
                preallocatedReverseAwbs: configService.get('SHADOWFAX_PREALLOCATED_REVERSE_AWBS', ''),
            },
        },
        buyerSiteUrl: configService.get('BUYER_SITE_URL', 'https://jebdekho.com'),
        webPush: {
            publicKey: configService.get('WEB_PUSH_PUBLIC_KEY', ''),
            privateKey: configService.get('WEB_PUSH_PRIVATE_KEY', ''),
            subject: configService.get('WEB_PUSH_SUBJECT', 'mailto:support@jebdekho.com'),
        },
        smtp: (() => {
            const host = configService.get('SMTP_HOST', '');
            const user = configService.get('SMTP_USER', '');
            const pass = configService.get('SMTP_PASS', '') ||
                configService.get('SMTP_PASSWORD', '');
            const enabled = Boolean(host && user && pass);
            return {
                enabled,
                host,
                port: configService.get('SMTP_PORT', 465),
                secure: configService.get('SMTP_SECURE', 'true') === 'true',
                user,
                pass,
                from: configService.get('EMAIL_FROM', 'JebDekho <support@jebdekho.com>'),
            };
        })(),
    };
}
//# sourceMappingURL=configuration.js.map