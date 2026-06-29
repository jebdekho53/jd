import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class WebPushService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private configured;
    private publicKey;
    private subject;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    isConfigured(): boolean;
    getPublicKey(): string;
    send(subscription: {
        endpoint: string;
        p256dh: string;
        auth: string;
    }, payload: string): Promise<{
        statusCode: number;
    }>;
}
