import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { CreateTransferDto } from './dto/fulfillment.dto';
export declare class InventoryTransferService {
    private readonly prisma;
    private readonly merchantDashboard;
    constructor(prisma: PrismaService, merchantDashboard: MerchantDashboardService);
    createTransfer(userId: string, dto: CreateTransferDto): Promise<{
        items: {
            id: string;
            variantId: string;
            sku: string;
            quantity: number;
            transferId: string;
        }[];
        fromStore: {
            name: string;
        };
        toStore: {
            name: string;
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
    }>;
    listTransfers(userId: string, storeId?: string): Promise<({
        items: {
            id: string;
            variantId: string;
            sku: string;
            quantity: number;
            transferId: string;
        }[];
        fromStore: {
            id: string;
            name: string;
            storeType: import("@prisma/client").$Enums.StoreType;
        };
        toStore: {
            id: string;
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
    approveTransfer(userId: string, transferId: string): Promise<{
        items: {
            id: string;
            variantId: string;
            sku: string;
            quantity: number;
            transferId: string;
        }[];
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
    }>;
    completeTransfer(userId: string, transferId: string): Promise<({
        items: {
            id: string;
            variantId: string;
            sku: string;
            quantity: number;
            transferId: string;
        }[];
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
    }) | null>;
    private getOwnedTransfer;
}
