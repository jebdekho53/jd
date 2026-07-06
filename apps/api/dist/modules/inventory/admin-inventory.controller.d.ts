import { InventoryService } from './inventory.service';
import { ListAdminInventoryDto } from './dto/inventory.dto';
export declare class AdminInventoryController {
    private readonly inventory;
    constructor(inventory: InventoryService);
    list(dto: ListAdminInventoryDto): Promise<{
        success: boolean;
        data: {
            items: any;
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
            lowStockCount: any;
            fastMoving: any;
            slowMoving: any;
        };
    }>;
}
