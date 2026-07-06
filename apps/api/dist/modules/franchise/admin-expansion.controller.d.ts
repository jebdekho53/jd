import { FranchisePartnerStatus } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { FranchiseService } from './franchise.service';
import { TerritoryService } from './territory.service';
import { ExpansionService } from './expansion.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
import { CreateCityLaunchDto, CreateFranchiseDto, UpdateFranchiseDto } from './dto/franchise.dto';
export declare class AdminExpansionController {
    private readonly franchise;
    private readonly territory;
    private readonly expansion;
    private readonly analytics;
    private readonly settlements;
    constructor(franchise: FranchiseService, territory: TerritoryService, expansion: ExpansionService, analytics: FranchiseAnalyticsService, settlements: FranchiseSettlementService);
    overview(): Promise<{
        success: boolean;
        data: any;
    }>;
    cities(): Promise<{
        success: boolean;
        data: any;
    }>;
    franchises(status?: FranchisePartnerStatus): Promise<{
        success: boolean;
        data: any;
    }>;
    conflicts(): Promise<{
        success: boolean;
        data: any;
    }>;
    createFranchise(dto: CreateFranchiseDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateFranchise(id: string, dto: UpdateFranchiseDto, user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    cityLaunch(dto: CreateCityLaunchDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
export declare class AdminFranchiseAnalyticsController {
    private readonly analytics;
    constructor(analytics: FranchiseAnalyticsService);
    franchiseAnalytics(): Promise<{
        success: boolean;
        data: {
            activeFranchises: any;
            platformGmv30d: number;
            franchiseGmvTotal: number;
            franchiseShareTotal: number;
            ordersDelivered30d: any;
            cityGmv: any;
            expansionPipeline: any;
            territoryUtilization: number;
        };
    }>;
}
