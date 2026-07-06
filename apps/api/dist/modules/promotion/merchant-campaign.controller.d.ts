import { RequestUser } from '../../common/types';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, CreateOfferDto, ListCampaignsDto, UpdateCampaignDto } from './dto/campaign.dto';
export declare class MerchantCampaignController {
    private readonly campaigns;
    constructor(campaigns: CampaignService);
    list(user: RequestUser, storeId: string, dto: ListCampaignsDto): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    create(user: RequestUser, storeId: string, dto: CreateCampaignDto): Promise<{
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
    performance(user: RequestUser, storeId: string, campaignId: string): Promise<{
        success: boolean;
        data: {
            campaign: {
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
            impressions: any;
            clicks: any;
            orders: any;
            redemptions: any;
            conversion: number;
            gmvGenerated: number;
            discountGiven: number;
            incrementalRevenue: number;
        };
    }>;
    pause(user: RequestUser, storeId: string, campaignId: string): Promise<{
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
    resume(user: RequestUser, storeId: string, campaignId: string): Promise<{
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
    update(user: RequestUser, storeId: string, campaignId: string, dto: UpdateCampaignDto): Promise<{
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
    addOffer(user: RequestUser, storeId: string, campaignId: string, dto: CreateOfferDto): Promise<{
        success: boolean;
        data: {
            id: string;
            campaignId: string;
            name: string;
            kind: OfferKind;
            discountValue: number;
            expiresAt: string;
            isActive: boolean;
        };
    }>;
}
