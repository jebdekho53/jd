import { DomainEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export type DomainEventPayload = Prisma.InputJsonValue;
export type DomainEventMetadata = Prisma.InputJsonValue;
export declare class DomainEventsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    emit(eventType: DomainEventType, aggregateType: string, aggregateId: string, payload: DomainEventPayload, metadata?: DomainEventMetadata): Promise<string>;
    markProcessed(eventId: string): Promise<void>;
    getUnprocessed(eventType: DomainEventType, limit?: number): Promise<Array<{
        id: string;
        aggregateId: string;
        payload: unknown;
    }>>;
}
