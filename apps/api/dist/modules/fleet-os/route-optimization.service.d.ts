import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
export declare class RouteOptimizationService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventEmitter2);
    optimizeForBatch(batchId: string): Promise<{
        id: string;
        createdAt: Date;
        distanceKm: number;
        estimatedMinutes: number;
        batchId: string | null;
        riderId: string;
        optimized: boolean;
        routeSequence: Prisma.JsonValue | null;
    } | null>;
    getLatestForRider(riderId: string): Promise<{
        id: string;
        createdAt: Date;
        distanceKm: number;
        estimatedMinutes: number;
        batchId: string | null;
        riderId: string;
        optimized: boolean;
        routeSequence: Prisma.JsonValue | null;
    } | null>;
}
