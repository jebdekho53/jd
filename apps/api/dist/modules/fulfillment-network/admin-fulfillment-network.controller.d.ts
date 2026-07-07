import { AdminFulfillmentNetworkService } from './admin-fulfillment-network.service';
export declare class AdminFulfillmentNetworkController {
    private readonly admin;
    constructor(admin: AdminFulfillmentNetworkService);
    dashboard(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    transfers(): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
    capacity(): Promise<{
        success: boolean;
        data: {
            storeId: string;
            storeName: string;
            storeType: import("@prisma/client").$Enums.StoreType;
            lat: number;
            lng: number;
            currentLoadPct: number;
            peakLoadPct: number;
            backlogCount: number;
        }[];
    }>;
    sla(): Promise<{
        success: boolean;
        data: {
            fulfillmentSlaPct: number;
            avgEtaMins: number;
            ordersDelivered7d: number;
            pickTimeMins: number;
            packTimeMins: number;
        };
    }>;
}
