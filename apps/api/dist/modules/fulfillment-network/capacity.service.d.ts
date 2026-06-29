import { PrismaService } from '../../database/prisma.service';
export declare class CapacityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLatestCapacity(storeId: string): Promise<{
        id: string;
        storeId: string;
        ordersPerHour: number;
        pickersAvailable: number;
        packingStations: number;
        currentLoadPct: number;
        peakLoadPct: number;
        backlogCount: number;
        snapshotAt: Date;
    } | null>;
    snapshotStoreCapacity(storeId: string): Promise<{
        id: string;
        storeId: string;
        ordersPerHour: number;
        pickersAvailable: number;
        packingStations: number;
        currentLoadPct: number;
        peakLoadPct: number;
        backlogCount: number;
        snapshotAt: Date;
    }>;
    listNetworkCapacity(storeIds: string[]): Promise<{
        storeId: string;
        snapshot: {
            id: string;
            storeId: string;
            ordersPerHour: number;
            pickersAvailable: number;
            packingStations: number;
            currentLoadPct: number;
            peakLoadPct: number;
            backlogCount: number;
            snapshotAt: Date;
        } | null;
    }[]>;
}
