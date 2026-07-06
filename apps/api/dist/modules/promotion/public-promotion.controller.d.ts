import { StorePromotionService } from './store-promotion.service';
import { OfferEngineService } from './offer-engine.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { TrackCampaignEventDto } from './dto/campaign.dto';
export declare class PublicPromotionController {
    private readonly promotions;
    private readonly offers;
    private readonly analytics;
    constructor(promotions: StorePromotionService, offers: OfferEngineService, analytics: CampaignAnalyticsService);
    topDeals(): Promise<{
        success: boolean;
        data: any;
    }>;
    trendingDeals(): Promise<{
        success: boolean;
        data: any;
    }>;
    freeDeliveryStores(): Promise<{
        success: boolean;
        data: any;
    }>;
    storeOffers(slug: string): Promise<{
        success: boolean;
        data: any;
    }>;
    storeCoupons(slug: string): Promise<{
        success: boolean;
        data: any;
    }>;
    flashSales(limit?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    offersNearYou(lat: string, lng: string, limit?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    trackEvent(dto: TrackCampaignEventDto): Promise<{
        success: boolean;
    }>;
}
