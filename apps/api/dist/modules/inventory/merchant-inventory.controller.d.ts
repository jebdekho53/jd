import { InventoryStatus } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { InventoryService } from './inventory.service';
import { BulkAdjustInventoryDto, ListStoreInventoryDto } from './dto/inventory.dto';
import { UpdateInventoryDto } from '../product/dto/update-inventory.dto';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
export declare class MerchantInventoryController {
    private readonly inventory;
    private readonly prisma;
    private readonly merchantService;
    constructor(inventory: InventoryService, prisma: PrismaService, merchantService: MerchantService);
    list(user: RequestUser, storeId: string, dto: ListStoreInventoryDto): Promise<{
        success: boolean;
        data: {
            items: ({
                productId: string;
                productName: string;
                category: {
                    id: string;
                    name: string;
                } | null;
                variantId: string;
                variantName: string;
                sku: string;
                availableQty: number;
                reservedQty: number;
                soldQty: number;
                lowStockThreshold: number;
                status: import("@prisma/client").$Enums.InventoryStatus;
                stockLevel: import("./inventory.service").StockLevel;
                isActive: boolean;
            } | null)[];
            page: number;
            limit: number;
        };
    }>;
    adjust(user: RequestUser, storeId: string, variantId: string, dto: UpdateInventoryDto, ip: string): Promise<{
        success: boolean;
        data: {
            availableQty: number;
            reservedQty: number;
            soldQty: number;
            status: InventoryStatus;
        };
    }>;
    bulkAdjust(user: RequestUser, storeId: string, dto: BulkAdjustInventoryDto, ip: string): Promise<{
        success: boolean;
        data: {
            availableQty: number;
            reservedQty: number;
            soldQty: number;
            status: InventoryStatus;
        }[];
    }>;
    disable(user: RequestUser, storeId: string, variantId: string): Promise<{
        success: boolean;
    }>;
    private assertStore;
    private assertVariantInStore;
}
