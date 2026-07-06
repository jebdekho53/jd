import { ConfigService } from '@nestjs/config';
export declare function getConfig(configService: ConfigService): {
    readonly nodeEnv: any;
    readonly port: any;
    readonly jwt: {
        readonly privateKey: string;
        readonly publicKey: string;
        readonly keyId: any;
        readonly accessExpiresIn: any;
        readonly refreshExpiresIn: any;
        readonly issuer: any;
        readonly audience: any;
    };
    readonly otp: {
        readonly length: any;
        readonly expiresMinutes: any;
        readonly maxAttempts: any;
        readonly rateLimitRequests: any;
        readonly rateLimitWindowMinutes: any;
    };
    readonly auth: {
        readonly emailEnabled: boolean;
        readonly phoneOtpEnabled: boolean;
        readonly smsEnabled: boolean;
        readonly whatsappEnabled: boolean;
        readonly msg91Enabled: boolean;
    };
    readonly sms: {
        readonly provider: any;
        readonly msg91: {
            readonly authKey: any;
            readonly senderId: any;
            readonly templateId: any;
            readonly dltTeId: any;
        };
    };
    readonly whatsapp: {
        readonly otpEnabled: boolean;
        readonly phoneNumberId: any;
        readonly businessAccountId: any;
        readonly appId: any;
        readonly testRecipient: any;
        readonly graphVersion: any;
        readonly otpTemplateName: any;
        readonly otpTemplateLang: any;
    };
    readonly cors: {
        readonly origins: any;
    };
    readonly storage: {
        readonly provider: any;
        readonly uploadDir: any;
        readonly uploadPublicUrl: any;
    };
    readonly trustProxy: boolean;
    readonly logging: {
        readonly level: any;
    };
    readonly throttle: {
        readonly ttl: any;
        readonly limit: any;
        readonly authLimit: any;
    };
    readonly razorpay: {
        readonly keyId: any;
        readonly keySecret: any;
        readonly webhookSecret: any;
    };
    readonly logistics: {
        readonly deliveryProvider: any;
        readonly enableOwnFleet: boolean;
        readonly enableShadowfax: boolean;
        readonly enablePorter: boolean;
        readonly enableDelhivery: boolean;
        readonly enableBorzo: boolean;
        readonly shadowfax: {
            readonly apiUrl: any;
            readonly apiMode: any;
            readonly creditsKey: any;
            readonly clientId: any;
            readonly clientSecret: any;
            readonly testToken: any;
            readonly productionToken: any;
            readonly webhookSecret: any;
            readonly preallocatedAwbs: any;
            readonly preallocatedReverseAwbs: any;
        };
    };
    readonly buyerSiteUrl: any;
    readonly webPush: {
        readonly publicKey: any;
        readonly privateKey: any;
        readonly subject: any;
    };
    readonly smtp: {
        enabled: boolean;
        host: any;
        port: any;
        secure: boolean;
        user: any;
        pass: any;
        from: any;
    };
};
export type AppConfig = ReturnType<typeof getConfig>;
