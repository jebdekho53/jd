import { ConfigService } from '@nestjs/config';
export declare function getConfig(configService: ConfigService): {
    readonly nodeEnv: string;
    readonly port: number;
    readonly jwt: {
        readonly privateKey: string;
        readonly publicKey: string;
        readonly keyId: string;
        readonly accessExpiresIn: string;
        readonly refreshExpiresIn: string;
        readonly issuer: string;
        readonly audience: string;
    };
    readonly otp: {
        readonly length: number;
        readonly expiresMinutes: number;
        readonly maxAttempts: number;
        readonly rateLimitRequests: number;
        readonly rateLimitWindowMinutes: number;
    };
    readonly auth: {
        readonly emailEnabled: boolean;
        readonly phoneOtpEnabled: boolean;
        readonly smsEnabled: boolean;
        readonly whatsappEnabled: boolean;
        readonly msg91Enabled: boolean;
    };
    readonly sms: {
        readonly provider: string;
        readonly msg91: {
            readonly authKey: string;
            readonly senderId: string;
            readonly templateId: string;
            readonly dltTeId: string;
        };
    };
    readonly whatsapp: {
        readonly otpEnabled: boolean;
        readonly phoneNumberId: string;
        readonly businessAccountId: string;
        readonly appId: string;
        readonly testRecipient: string;
        readonly graphVersion: string;
        readonly otpTemplateName: string;
        readonly otpTemplateLang: string;
    };
    readonly cors: {
        readonly origins: string[];
    };
    readonly storage: {
        readonly provider: string;
        readonly uploadDir: string;
        readonly uploadPublicUrl: string;
    };
    readonly trustProxy: boolean;
    readonly logging: {
        readonly level: string;
    };
    readonly throttle: {
        readonly ttl: number;
        readonly limit: number;
        readonly authLimit: number;
    };
    readonly razorpay: {
        readonly keyId: string;
        readonly keySecret: string;
        readonly webhookSecret: string;
    };
    readonly logistics: {
        readonly deliveryProvider: string;
        readonly enableOwnFleet: boolean;
        readonly enableShadowfax: boolean;
        readonly enablePorter: boolean;
        readonly enableDelhivery: boolean;
        readonly enableBorzo: boolean;
        readonly shadowfax: {
            readonly apiUrl: string;
            readonly apiMode: string;
            readonly creditsKey: string;
            readonly clientId: string;
            readonly clientSecret: string;
            readonly testToken: string;
            readonly productionToken: string;
            readonly webhookSecret: string;
            readonly preallocatedAwbs: string;
            readonly preallocatedReverseAwbs: string;
        };
    };
    readonly buyerSiteUrl: string;
    readonly webPush: {
        readonly publicKey: string;
        readonly privateKey: string;
        readonly subject: string;
    };
    readonly smtp: {
        enabled: boolean;
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
    };
};
export type AppConfig = ReturnType<typeof getConfig>;
