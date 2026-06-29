import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { BatchingService } from './batching.service';
import { RouteOptimizationService } from './route-optimization.service';
export declare class RiderFleetController {
    private readonly prisma;
    private readonly batching;
    private readonly routes;
    constructor(prisma: PrismaService, batching: BatchingService, routes: RouteOptimizationService);
    private riderId;
    queue(user: RequestUser): Promise<{
        success: boolean;
        data: null;
    } | {
        success: boolean;
        data: {
            currentBatch: ({
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
            }) | null;
            upcomingOrders: ({
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
        };
    }>;
    route(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            distanceKm: number;
            estimatedMinutes: number;
            batchId: string | null;
            riderId: string;
            optimized: boolean;
            routeSequence: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    }>;
}
