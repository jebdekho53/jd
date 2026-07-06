import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { type BatchableOrder } from './batching.util';
export declare class BatchingService {
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, events: EventEmitter2);
    createBatchesForRider(riderId: string): Promise<any>;
    autoBatchUnassigned(): Promise<BatchableOrder[][]>;
    getRiderBatch(riderId: string): Promise<any>;
    getOrderBatchInfo(orderId: string): Promise<{
        isBatched: boolean;
        batchId?: undefined;
        batchStatus?: undefined;
        sequence?: undefined;
        totalOrders?: undefined;
        orders?: undefined;
    } | {
        isBatched: boolean;
        batchId: any;
        batchStatus: any;
        sequence: any;
        totalOrders: any;
        orders: any;
    }>;
    listActiveBatches(): Promise<any>;
}
