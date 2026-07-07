import { MarketingEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface TrackEventInput {
    userId?: string;
    eventType: MarketingEventType;
    sessionId?: string;
    storeId?: string;
    productId?: string;
    orderId?: string;
    metadata?: Prisma.InputJsonValue;
}
export declare class MarketingEventService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    track(input: TrackEventInput): Promise<{
        id: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        eventType: import("@prisma/client").$Enums.MarketingEventType;
        userId: string | null;
        storeId: string | null;
        productId: string | null;
        orderId: string | null;
        sessionId: string | null;
    }>;
    private updateAffinities;
}
