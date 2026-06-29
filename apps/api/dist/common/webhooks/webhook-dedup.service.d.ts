import { WebhookProvider } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export type WebhookClaimResult = {
    action: 'process';
    recordId: string;
} | {
    action: 'duplicate';
} | {
    action: 'retry';
    recordId: string;
};
export declare class WebhookDedupService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    hashPayload(rawBody: Buffer): string;
    claimEvent(provider: WebhookProvider, eventId: string | null | undefined, rawBody: Buffer, signature?: string): Promise<WebhookClaimResult>;
    markProcessed(recordId: string): Promise<void>;
    markFailed(recordId: string, error: string): Promise<void>;
    markDuplicate(recordId: string): Promise<void>;
}
