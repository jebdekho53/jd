import { PrismaService } from '../../database/prisma.service';
export declare class CapacityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLatestCapacity(storeId: string): Promise<any>;
    snapshotStoreCapacity(storeId: string): Promise<any>;
    listNetworkCapacity(storeIds: string[]): Promise<{
        storeId: string;
        snapshot: any;
    }[]>;
}
