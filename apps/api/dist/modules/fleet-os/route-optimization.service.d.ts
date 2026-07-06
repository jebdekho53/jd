import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
export declare class RouteOptimizationService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventEmitter2);
    optimizeForBatch(batchId: string): Promise<any>;
    getLatestForRider(riderId: string): Promise<any>;
}
