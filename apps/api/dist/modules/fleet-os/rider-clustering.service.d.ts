import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
export declare class RiderClusteringService {
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, events: EventEmitter2);
    refreshClusters(): Promise<any[]>;
    listClusters(): Promise<any>;
}
