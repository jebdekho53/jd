import { PrismaService } from '../../database/prisma.service';
import { CapacityService } from './capacity.service';
export declare class SmartFulfillmentService {
    private readonly prisma;
    private readonly capacity;
    private readonly logger;
    constructor(prisma: PrismaService, capacity: CapacityService);
    allocateOrder(orderId: string): Promise<void>;
    getFulfillmentSourceForOrder(orderId: string): Promise<string | null>;
    private setPrimaryFulfillmentSource;
    private createSingleFulfillment;
    private getEligibleStores;
    private routeItems;
    private canFulfillAll;
    private getAvailableAtStore;
    private scoreStoreForAllItems;
    private scoreStoreForItems;
}
