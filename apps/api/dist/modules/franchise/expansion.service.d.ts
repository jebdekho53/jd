import { CityLaunchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class ExpansionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    computeCityReadiness(city: string, state: string): Promise<number>;
    refreshCityLaunchPlan(city: string, state: string): Promise<{
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
    }>;
    listCities(): Promise<{
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
    }[]>;
    createCityLaunch(input: {
        city: string;
        state: string;
        launchStatus?: CityLaunchStatus;
        targetStores?: number;
        targetRiders?: number;
        targetGmv?: number;
    }): Promise<{
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
    }>;
    triggerLaunchCampaign(city: string, state: string): Promise<{
        city: string;
        state: string;
        campaignTriggered: boolean;
    }>;
}
