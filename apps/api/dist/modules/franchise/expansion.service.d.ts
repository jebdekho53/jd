import { CityLaunchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class ExpansionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    computeCityReadiness(city: string, state: string): Promise<number>;
    refreshCityLaunchPlan(city: string, state: string): Promise<any>;
    listCities(): Promise<any>;
    createCityLaunch(input: {
        city: string;
        state: string;
        launchStatus?: CityLaunchStatus;
        targetStores?: number;
        targetRiders?: number;
        targetGmv?: number;
    }): Promise<any>;
    triggerLaunchCampaign(city: string, state: string): Promise<{
        city: string;
        state: string;
        campaignTriggered: boolean;
    }>;
}
