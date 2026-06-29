import { FranchisePartnerStatus, CityLaunchStatus } from '@prisma/client';
export declare class CreateFranchiseDto {
    userId: string;
    businessName: string;
    gstin?: string;
    pan?: string;
    cityId?: string;
    commissionPercent?: number;
}
export declare class UpdateFranchiseDto {
    status?: FranchisePartnerStatus;
    commissionPercent?: number;
    onboardingCompleted?: boolean;
}
export declare class CreateCityLaunchDto {
    city: string;
    state: string;
    launchStatus?: CityLaunchStatus;
    targetStores?: number;
    targetRiders?: number;
    targetGmv?: number;
}
export declare class AssignTerritoryDto {
    city: string;
    state: string;
    pincodes: string[];
    exclusivityEnabled?: boolean;
}
