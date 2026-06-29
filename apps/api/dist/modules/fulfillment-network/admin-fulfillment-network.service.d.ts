import { PrismaService } from '../../database/prisma.service';
export declare class AdminFulfillmentNetworkService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        activeNetworks: number;
        darkStores: number;
        pendingTransfers: number;
        splitOrderRatio: number;
        recentActivity: ({
            store: {
                name: string;
            } | null;
            order: {
                orderNumber: string;
            } | null;
        } & {
            id: string;
            action: import("@prisma/client").$Enums.FulfillmentAuditAction;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            storeId: string | null;
            orderId: string | null;
            networkId: string | null;
        })[];
    }>;
    listTransfers(): Promise<({
        items: {
            id: string;
            variantId: string;
            sku: string;
            quantity: number;
            transferId: string;
        }[];
        fromStore: {
            name: string;
            storeType: import("@prisma/client").$Enums.StoreType;
        };
        toStore: {
            name: string;
            storeType: import("@prisma/client").$Enums.StoreType;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InventoryTransferStatus;
        completedAt: Date | null;
        cancelledAt: Date | null;
        notes: string | null;
        merchantProfileId: string;
        requestedAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        fromStoreId: string;
        toStoreId: string;
    })[]>;
    getCapacityHeatmap(): Promise<{
        storeId: string;
        storeName: string;
        storeType: import("@prisma/client").$Enums.StoreType;
        lat: number;
        lng: number;
        currentLoadPct: number;
        peakLoadPct: number;
        backlogCount: number;
    }[]>;
    getSlaMetrics(): Promise<{
        fulfillmentSlaPct: number;
        avgEtaMins: number;
        ordersDelivered7d: number;
        pickTimeMins: number;
        packTimeMins: number;
    }>;
}
