import { RequestUser } from '../../common/types';
import { FranchiseService } from './franchise.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
export declare class FranchisePortalController {
    private readonly franchise;
    private readonly analytics;
    private readonly settlements;
    constructor(franchise: FranchiseService, analytics: FranchiseAnalyticsService, settlements: FranchiseSettlementService);
    dashboard(user: RequestUser): Promise<{
        success: boolean;
        data: {
            businessName: any;
            status: any;
            gmv30d: number;
            orders30d: any;
            revenueShare: number;
            commissionPercent: any;
            storeCount: any;
            riderCount: any;
            territories: any;
            pincodes: any;
        } | null;
    }>;
    stores(user: RequestUser): Promise<{
        success: boolean;
        data: {
            businessName: any;
            status: any;
            gmv30d: number;
            orders30d: any;
            revenueShare: number;
            commissionPercent: any;
            storeCount: any;
            riderCount: any;
            territories: any;
            pincodes: any;
        } | null;
    }>;
    territory(user: RequestUser): Promise<{
        success: boolean;
        data: {
            territories: any;
            pincodes: any;
        };
    }>;
    finance(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
}
