import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { type BatchableOrder } from './batching.util';
export declare class BatchingService {
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, events: EventEmitter2);
    createBatchesForRider(riderId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeliveryBatchStatus;
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date | null;
        riderId: string;
        totalOrders: number;
    } | null>;
    autoBatchUnassigned(): Promise<BatchableOrder[][]>;
    getRiderBatch(riderId: string): Promise<({
        items: ({
            order: {
                id: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                orderNumber: string;
            };
        } & {
            id: string;
            orderId: string;
            batchId: string;
            sequence: number;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.DeliveryBatchStatus;
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date | null;
        riderId: string;
        totalOrders: number;
    }) | null>;
    getOrderBatchInfo(orderId: string): Promise<{
        isBatched: boolean;
        batchId?: undefined;
        batchStatus?: undefined;
        sequence?: undefined;
        totalOrders?: undefined;
        orders?: undefined;
    } | {
        isBatched: boolean;
        batchId: string;
        batchStatus: import("@prisma/client").$Enums.DeliveryBatchStatus;
        sequence: number;
        totalOrders: number;
        orders: string[];
    }>;
    listActiveBatches(): Promise<({
        items: ({
            order: {
                orderNumber: string;
            };
        } & {
            id: string;
            orderId: string;
            batchId: string;
            sequence: number;
        })[];
        rider: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.DeliveryBatchStatus;
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date | null;
        riderId: string;
        totalOrders: number;
    })[]>;
}
