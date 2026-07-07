import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RazorpayService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private client;
    readonly keyId: string;
    private readonly keySecret;
    private readonly webhookSecret;
    private readonly nodeEnv;
    constructor(config: ConfigService);
    onModuleInit(): void;
    isConfigured(): boolean;
    hasWebhookSecret(): boolean;
    createOrder(amountRupees: number, receipt: string): Promise<{
        id: string;
        amount: number;
        currency: string;
    }>;
    verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean;
    verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
    fetchOrderPayments(razorpayOrderId: string): Promise<Array<{
        id: string;
        status: string;
        contact?: string;
        email?: string;
    }>>;
    createRefund(razorpayPaymentId: string, amountRupees: number, notes?: Record<string, string>): Promise<{
        id: string;
        amount: number;
    }>;
}
