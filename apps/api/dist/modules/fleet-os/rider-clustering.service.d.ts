import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
export declare class RiderClusteringService {
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, events: EventEmitter2);
    refreshClusters(): Promise<{
        city: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        locality: string;
        activeRiders: number;
        activeOrders: number;
        demandSupplyRatio: number;
    }[]>;
    listClusters(): Promise<{
        city: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        locality: string;
        activeRiders: number;
        activeOrders: number;
        demandSupplyRatio: number;
    }[]>;
}
