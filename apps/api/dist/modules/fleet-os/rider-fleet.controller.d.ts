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
            currentBatch: any;
            upcomingOrders: any;
        };
    }>;
    route(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
}
