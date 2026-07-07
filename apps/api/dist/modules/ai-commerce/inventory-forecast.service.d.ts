import { PrismaService } from '../../database/prisma.service';
export declare class InventoryForecastService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runForecastsForStore(storeId: string): Promise<number>;
    runAllForecasts(): Promise<number>;
    getMerchantInventory(storeIds: string[]): Promise<({
        product: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        daysUntilStockout: number;
        recommendedQty: number;
        urgency: import("@prisma/client").$Enums.InventoryForecastUrgency;
    })[]>;
    getInventoryCrises(): Promise<({
        store: {
            name: string;
        };
        product: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        daysUntilStockout: number;
        recommendedQty: number;
        urgency: import("@prisma/client").$Enums.InventoryForecastUrgency;
    })[]>;
}
