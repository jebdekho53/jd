import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { DeliveryOrchestratorService } from '../delivery-orchestrator.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ShadowfaxWebhookService {
    private readonly prisma;
    private readonly orchestrator;
    private readonly events;
    private readonly logger;
    private readonly webhookSecret;
    constructor(prisma: PrismaService, orchestrator: DeliveryOrchestratorService, events: EventEmitter2, config: ConfigService);
    verifySignature(rawBody: Buffer, signature: string | undefined): void;
    matchesAuthorizationToken(authorization: string | undefined): boolean;
    verifyWebhookAuth(rawBody: Buffer, signature?: string, authorization?: string): void;
    handlePayload(rawBody: Buffer, signature?: string, authorization?: string): Promise<void>;
    private processShadowfaxEvent;
}
