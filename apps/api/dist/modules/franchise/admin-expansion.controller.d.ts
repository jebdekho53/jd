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
        data: {
            cities: {
                city: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                state: string;
                cityId: string | null;
                actualStores: number;
                actualRiders: number;
                launchStatus: import("@prisma/client").$Enums.CityLaunchStatus;
                readinessScore: number;
                targetStores: number;
                targetRiders: number;
                targetGmv: import("@prisma/client/runtime/library").Decimal;
                actualGmv: import("@prisma/client/runtime/library").Decimal;
            }[];
            conflicts: ({
                franchise: {
                    businessName: string;
                };
                primaryTerritory: {
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
                };
                conflictingTerritory: {
                    franchise: {
                        businessName: string;
                    };
                } & {
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
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.TerritoryConflictStatus;
                createdAt: Date;
                resolvedAt: Date | null;
                resolution: string | null;
                pincode: string;
                franchiseId: string;
                primaryTerritoryId: string;
                conflictingTerritoryId: string;
            })[];
            revenue: ({
                franchise: {
                    businessName: string;
                };
            } & {
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
            })[];
            franchises: ({
                city: {
                    name: string;
                } | null;
                _count: {
                    stores: number;
                    territories: number;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.FranchisePartnerStatus;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                businessName: string;
                cityId: string | null;
                commissionPercent: number;
                gstin: string | null;
                pan: string | null;
                onboardingCompleted: boolean;
            })[];
            active: number;
            pending: number;
            suspended: number;
            openConflicts: number;
        };
    }>;
    cities(): Promise<{
        success: boolean;
        data: {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
            cityId: string | null;
            actualStores: number;
            actualRiders: number;
            launchStatus: import("@prisma/client").$Enums.CityLaunchStatus;
            readinessScore: number;
            targetStores: number;
            targetRiders: number;
            targetGmv: import("@prisma/client/runtime/library").Decimal;
            actualGmv: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    franchises(status?: FranchisePartnerStatus): Promise<{
        success: boolean;
        data: ({
            city: {
                name: string;
            } | null;
            _count: {
                stores: number;
                territories: number;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.FranchisePartnerStatus;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            businessName: string;
            cityId: string | null;
            commissionPercent: number;
            gstin: string | null;
            pan: string | null;
            onboardingCompleted: boolean;
        })[];
    }>;
    conflicts(): Promise<{
        success: boolean;
        data: ({
            franchise: {
                businessName: string;
            };
            primaryTerritory: {
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
            };
            conflictingTerritory: {
                franchise: {
                    businessName: string;
                };
            } & {
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
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.TerritoryConflictStatus;
            createdAt: Date;
            resolvedAt: Date | null;
            resolution: string | null;
            pincode: string;
            franchiseId: string;
            primaryTerritoryId: string;
            conflictingTerritoryId: string;
        })[];
    }>;
    createFranchise(dto: CreateFranchiseDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.FranchisePartnerStatus;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            businessName: string;
            cityId: string | null;
            commissionPercent: number;
            gstin: string | null;
            pan: string | null;
            onboardingCompleted: boolean;
        };
    }>;
    updateFranchise(id: string, dto: UpdateFranchiseDto, user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.FranchisePartnerStatus;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            businessName: string;
            cityId: string | null;
            commissionPercent: number;
            gstin: string | null;
            pan: string | null;
            onboardingCompleted: boolean;
        };
    }>;
    cityLaunch(dto: CreateCityLaunchDto): Promise<{
        success: boolean;
        data: {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
            cityId: string | null;
            actualStores: number;
            actualRiders: number;
            launchStatus: import("@prisma/client").$Enums.CityLaunchStatus;
            readinessScore: number;
            targetStores: number;
            targetRiders: number;
            targetGmv: import("@prisma/client/runtime/library").Decimal;
            actualGmv: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
}
export declare class AdminFranchiseAnalyticsController {
    private readonly analytics;
    constructor(analytics: FranchiseAnalyticsService);
    franchiseAnalytics(): Promise<{
        success: boolean;
        data: {
            activeFranchises: number;
            platformGmv30d: number;
            franchiseGmvTotal: number;
            franchiseShareTotal: number;
            ordersDelivered30d: number;
            cityGmv: {
                city: string;
                state: string;
                gmv: number;
                readinessScore: number;
                launchStatus: import("@prisma/client").$Enums.CityLaunchStatus;
            }[];
            expansionPipeline: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.CityLaunchPlanGroupByOutputType, "launchStatus"[]> & {
                _count: {
                    id: number;
                };
            })[];
            territoryUtilization: number;
        };
    }>;
}
