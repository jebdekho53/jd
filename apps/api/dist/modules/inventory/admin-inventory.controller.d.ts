import { InventoryService } from './inventory.service';
import { ListAdminInventoryDto } from './dto/inventory.dto';
export declare class AdminInventoryController {
    private readonly inventory;
    constructor(inventory: InventoryService);
    list(dto: ListAdminInventoryDto): Promise<{
        success: boolean;
        data: {
            items: {
                productId: string;
                productName: string;
                storeId: string;
                storeName: string;
                variantId: string;
                sku: string;
                availableQty: number;
                reservedQty: number;
                soldQty: number;
                lowStockThreshold: number;
                status: import("@prisma/client").$Enums.InventoryStatus;
                stockLevel: import("./inventory.service").StockLevel;
                fssaiLicense: string | null;
                countryOfOrigin: string | null;
                shelfLife: string | null;
            }[];
            page: number;
            limit: number;
        };
    }>;
    analytics(): Promise<{
        success: boolean;
        data: {
            totalAvailable: number;
            totalReserved: number;
            totalSold: number;
            stockValue: number;
            lowStockCount: number;
            fastMoving: {
                productName: string;
                storeName: string;
                sku: string;
                soldQty: number;
                availableQty: number;
            }[];
            slowMoving: {
                productName: string;
                storeName: string;
                sku: string;
                availableQty: number;
            }[];
        };
    }>;
}
