import { RequestUser } from '../../common/types';
import { CampaignService } from './campaign.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { CreateCampaignDto, ListCampaignsDto, UpdateCampaignDto } from './dto/campaign.dto';
export declare class AdminCampaignController {
    private readonly campaigns;
    private readonly analytics;
    constructor(campaigns: CampaignService, analytics: CampaignAnalyticsService);
    list(dto: ListCampaignsDto): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    analyticsSummary(): Promise<{
        success: boolean;
        data: {
            summary: any;
            leaderboard: any;
            fraud: any;
        };
    }>;
    create(user: RequestUser, dto: CreateCampaignDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: CampaignScope;
            storeId: string | null;
            status: CampaignStatus;
            stackMode: OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
    update(user: RequestUser, id: string, dto: UpdateCampaignDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: CampaignScope;
            storeId: string | null;
            status: CampaignStatus;
            stackMode: OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
    pause(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: CampaignScope;
            storeId: string | null;
            status: CampaignStatus;
            stackMode: OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
    resume(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: CampaignScope;
            storeId: string | null;
            status: CampaignStatus;
            stackMode: OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
}
