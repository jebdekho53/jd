import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ShadowfaxWebhookService } from './shadowfax-webhook.service';
export declare class LogisticsWebhookController {
    private readonly shadowfaxWebhook;
    constructor(shadowfaxWebhook: ShadowfaxWebhookService);
    handleShadowfax(req: RawBodyRequest<Request>, signature: string, altSignature: string, authorization: string): Promise<{
        success: boolean;
    }>;
}
