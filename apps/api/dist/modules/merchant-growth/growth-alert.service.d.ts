import { PrismaService } from '../../database/prisma.service';
import { StoreHealthService } from './store-health.service';
import { SearchAnalyticsService } from '../search-discovery/search-analytics.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
export declare class GrowthAlertService {
    private readonly prisma;
    private readonly health;
    private readonly search;
    private readonly dashboard;
    private readonly logger;
    constructor(prisma: PrismaService, health: StoreHealthService, search: SearchAnalyticsService, dashboard: MerchantDashboardService);
    listForStore(storeId: string, limit?: number): Promise<any>;
    evaluateAllStores(): Promise<void>;
    evaluateStore(storeId: string, userId: string): Promise<void>;
    private raise;
}
