import { PrismaService } from '../../database/prisma.service';
export declare class InventoryForecastService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runForecastsForStore(storeId: string): Promise<number>;
    runAllForecasts(): Promise<number>;
    getMerchantInventory(storeIds: string[]): Promise<any>;
    getInventoryCrises(): Promise<any>;
}
