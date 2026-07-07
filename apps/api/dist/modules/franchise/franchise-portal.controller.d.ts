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
            businessName: string;
            status: import("@prisma/client").$Enums.FranchisePartnerStatus;
            gmv30d: number;
            orders30d: number;
            revenueShare: number;
            commissionPercent: number;
            storeCount: number;
            riderCount: number;
            territories: {
                city: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                state: string;
                pincodes: string[];
                country: string;
                franchiseId: string;
                exclusivityEnabled: boolean;
                launchDate: Date | null;
            }[];
            pincodes: string[];
        } | null;
    }>;
    stores(user: RequestUser): Promise<{
        success: boolean;
        data: {
            businessName: string;
            status: import("@prisma/client").$Enums.FranchisePartnerStatus;
            gmv30d: number;
            orders30d: number;
            revenueShare: number;
            commissionPercent: number;
            storeCount: number;
            riderCount: number;
            territories: {
                city: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                state: string;
                pincodes: string[];
                country: string;
                franchiseId: string;
                exclusivityEnabled: boolean;
                launchDate: Date | null;
            }[];
            pincodes: string[];
        } | null;
    }>;
    territory(user: RequestUser): Promise<{
        success: boolean;
        data: {
            territories: {
                city: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                state: string;
                pincodes: string[];
                country: string;
                franchiseId: string;
                exclusivityEnabled: boolean;
                launchDate: Date | null;
            }[];
            pincodes: string[];
        };
    }>;
    finance(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.FranchiseSettlementStatus;
            createdAt: Date;
            paidAt: Date | null;
            franchiseId: string;
            periodStart: Date;
            periodEnd: Date;
            ledgerJournalId: string | null;
            grossGmv: import("@prisma/client/runtime/library").Decimal;
            franchiseShare: import("@prisma/client/runtime/library").Decimal;
            platformShare: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
}
